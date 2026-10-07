// Общие помощники для автотестов: запуск настоящего сервера на свободном порту и пустой базе.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const ROOT = path.join(__dirname, '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
    s.on('error', reject);
  });
}

async function startServer(extraEnv = {}) {
  const port = await freePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'drinkstar-test-'));
  const env = {
    ...process.env, PORT: String(port), DATA_DIR: dataDir, STAFF_PIN: '1234', ADMIN_PIN: '0000',
    PAYMENT_PROVIDER: 'mock', SMS_PROVIDER: 'demo', FORCE_OPEN: '1', NODE_ENV: 'test', ...extraEnv
  };
  delete env.BASE_URL;
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', d => { log += d; });
  child.stderr.on('data', d => { log += d; });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('сервер не запустился:\n' + log)), 8000);
    const iv = setInterval(() => { if (log.includes('DrinkStar:')) { clearInterval(iv); clearTimeout(t); resolve(); } }, 50);
    child.on('exit', code => { clearTimeout(t); clearInterval(iv); reject(new Error('сервер завершился (' + code + '):\n' + log)); });
  });
  const base = `http://127.0.0.1:${port}`;

  // запрос с удобным разбором ответа; cookie хранятся в jar
  const jar = {};
  async function call(method, url, body, headers = {}) {
    const h = { ...headers };
    if (body !== undefined && !h['Content-Type']) h['Content-Type'] = 'application/json';
    const ck = Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');
    if (ck && !h.Cookie) h.Cookie = ck;
    const r = await fetch(base + url, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    for (const c of sc) { const [kv] = c.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1); if (v) jar[k] = v; else delete jar[k]; }
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch { /* не JSON */ }
    return { status: r.status, json, text, headers: r.headers };
  }
  const stop = () => { child.kill(); try { fs.rmSync(dataDir, { recursive: true, force: true }); } catch { /* ignore */ } };
  return { base, call, jar, stop, dataDir, log: () => log };
}

// заголовки владельца: пробуем вход по токену (новая схема), иначе PIN в заголовке (старая)
async function adminHeaders(call, pin = '0000') {
  const r = await call('POST', '/api/admin/login', { pin });
  if (r.status === 200 && r.json?.token) return { 'x-admin-token': r.json.token };
  return { 'x-admin-pin': pin };
}

const LINES = [{ id: 'latte', v: 1, qty: 2, addons: [] }];
let phoneSeq = 0;
const uniquePhone = () => '+7702' + String(1000000 + (++phoneSeq) + (Date.now() % 1000) * 100).slice(-7);
const orderBody = (extra = {}) => ({ name: 'Айдар', phone: uniquePhone(), locationId: 'alfarabi5', payment: 'cash', consent: true, items: LINES, ...extra });

module.exports = { startServer, adminHeaders, orderBody, LINES };
