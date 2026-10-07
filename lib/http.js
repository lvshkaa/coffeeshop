// HTTP-слой: заголовки безопасности, разбор запроса, отдача статики со сжатием и ETag.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

class HttpError extends Error {
  constructor(status, message) { super(message || String(status)); this.status = status; }
}

// --- адрес клиента ---
// X-Forwarded-For подделывается клиентом, поэтому доверяем только адресу, который дописал НАШ прокси:
// берём запись, отстоящую от конца списка на число доверенных прокси (TRUST_PROXY_HOPS).
// Без прокси (локально, тесты) заголовок игнорируется целиком.
const HOPS = Math.max(0, parseInt(process.env.TRUST_PROXY_HOPS ?? (process.env.NODE_ENV === 'production' ? '1' : '0'), 10) || 0);
function clientIp(req) {
  const peer = req.socket.remoteAddress || '';
  if (!HOPS) return peer;
  const parts = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return peer;
  return parts[Math.max(0, parts.length - HOPS)] || peer;
}
const isHttps = req => !!req.socket.encrypted || (HOPS > 0 || process.env.NODE_ENV === 'test'
  ? String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' : false);

// --- заголовки безопасности ---
// Скрипты только свои (без unsafe-inline): внедрённый в страницу код не выполнится.
// Стили: inline разрешён (в разметке есть style=""), но стили не исполняют код.
function csp(https) {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self' https:",
    "object-src 'none'",
    ...(https ? ['upgrade-insecure-requests'] : [])
  ].join('; ');
}
function securityHeaders(req) {
  const https = isHttps(req);
  const h = {
    'Content-Security-Policy': csp(https),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
  if (https) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

// --- ответы ---
function sendJson(req, res, code, body, headers = {}) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': buf.length, 'Cache-Control': 'no-store', ...securityHeaders(req), ...headers });
  res.end(req.method === 'HEAD' ? undefined : buf);
}
function sendText(req, res, code, text, headers = {}) {
  const buf = Buffer.from(String(text));
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': buf.length, 'Cache-Control': 'no-store', ...securityHeaders(req), ...headers });
  res.end(req.method === 'HEAD' ? undefined : buf);
}

// --- чтение тела запроса ---
// Только JSON и только ограниченного размера: форма с другого сайта (text/plain) сюда не пройдёт.
async function readBody(req, limit = 20000) {
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  if (!ct.startsWith('application/json')) { req.resume(); throw new HttpError(415, 'Unsupported Media Type'); }
  const declared = +req.headers['content-length'] || 0;
  if (declared > limit) { req.resume(); throw new HttpError(413, 'Payload Too Large'); }
  const raw = await readRaw(req, limit);
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new HttpError(400, 'Bad JSON'); }
}
function readRaw(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let d = '', over = false;
    req.on('data', c => {
      if (over) return;
      d += c;
      if (d.length > limit) { over = true; d = ''; reject(new HttpError(413, 'Payload Too Large')); }
    });
    req.on('end', () => { if (!over) resolve(d); });
    req.on('error', reject);
  });
}

// --- cookie ---
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, v.join('=')]));

// --- статика: ETag, 304, сжатие brotli/gzip ---
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.woff2': 'font/woff2'
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const zcache = new Map(); // etag|enc -> Buffer (ограничен по размеру)
function compress(buf, etag, enc) {
  const key = etag + '|' + enc;
  let z = zcache.get(key);
  if (!z) {
    z = enc === 'br' ? zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }) : zlib.gzipSync(buf, { level: 6 });
    if (zcache.size > 300) zcache.delete(zcache.keys().next().value);
    zcache.set(key, z);
  }
  return z;
}
function sendBuffer(req, res, { body, type, ext, cache = 'no-cache', headers = {} }) {
  const etag = '"' + crypto.createHash('sha1').update(body).digest('base64').slice(0, 22) + '"';
  const base = { 'Content-Type': type, 'Cache-Control': cache, ETag: etag, Vary: 'Accept-Encoding', ...securityHeaders(req), ...headers };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, base); return res.end(); }
  const ae = String(req.headers['accept-encoding'] || '');
  let out = body;
  if (COMPRESSIBLE.has(ext) && body.length >= 512) {
    if (/\bbr\b/.test(ae)) { out = compress(body, etag, 'br'); base['Content-Encoding'] = 'br'; }
    else if (/\bgzip\b/.test(ae)) { out = compress(body, etag, 'gzip'); base['Content-Encoding'] = 'gzip'; }
  }
  base['Content-Length'] = out.length;
  res.writeHead(200, base);
  res.end(req.method === 'HEAD' ? undefined : out);
}

function createStatic(root) {
  const files = new Map(); // файл -> { mtimeMs, size, buf }
  return function serve(req, res, pathname) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(req, res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    let rel;
    try { rel = decodeURIComponent(pathname); } catch { return sendText(req, res, 400, 'Bad Request'); }
    if (rel.includes('\0')) return sendText(req, res, 400, 'Bad Request');
    if (rel === '/') rel = '/index.html';
    // служебные файлы (.env, .git) и выход из папки закрыты
    if (rel.split('/').some(seg => seg === '..' || (seg.startsWith('.') && seg.length > 0))) return sendText(req, res, 404, 'Not found');
    const file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root + path.sep)) return sendText(req, res, 403, 'Forbidden');
    let st;
    try { st = fs.statSync(file); } catch { return sendText(req, res, 404, 'Not found'); }
    if (!st.isFile()) return sendText(req, res, 404, 'Not found');
    let entry = files.get(file);
    if (!entry || entry.mtimeMs !== st.mtimeMs || entry.size !== st.size) {
      entry = { mtimeMs: st.mtimeMs, size: st.size, buf: fs.readFileSync(file) };
      if (files.size > 200) files.delete(files.keys().next().value);
      files.set(file, entry);
    }
    const ext = path.extname(file).toLowerCase();
    const longCache = rel.startsWith('/img/') || rel.startsWith('/audio/') || rel.startsWith('/icons/');
    sendBuffer(req, res, { body: entry.buf, type: TYPES[ext] || 'application/octet-stream', ext, cache: longCache ? 'public, max-age=86400' : 'no-cache' });
  };
}

module.exports = { HttpError, clientIp, isHttps, securityHeaders, sendJson, sendText, sendBuffer, readBody, readRaw, cookies, createStatic, TYPES };
