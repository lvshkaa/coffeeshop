// Внешняя копия: данные уходят в «GitHub» (тестовый двойник) и возвращаются на чистом диске.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer, adminHeaders, orderBody } = require('./helpers');

function fakeGithub() {
  const files = new Map();
  const srv = http.createServer((req, res) => {
    const m = req.url.match(/\/contents\/([^?]+)/);
    const name = m && decodeURIComponent(m[1]);
    if (req.headers.authorization !== 'Bearer tok') { res.writeHead(401); return res.end(); }
    if (req.method === 'GET') {
      const f = files.get(name);
      if (!f) { res.writeHead(404); return res.end('{}'); }
      if (String(req.headers.accept).includes('raw')) { res.writeHead(200); return res.end(f.buf); }
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ sha: f.sha }));
    }
    let d = ''; req.on('data', c => { d += c; }); req.on('end', () => {
      const b = JSON.parse(d);
      files.set(name, { buf: Buffer.from(b.content, 'base64'), sha: String(Date.now()) + Math.random() });
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}');
    });
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, files, url: 'http://127.0.0.1:' + srv.address().port })));
}

test('данные уходят во внешнюю копию и восстанавливаются на чистом диске', async () => {
  const gh = await fakeGithub();
  const env = { BACKUP_GITHUB_REPO: 'me/backups', BACKUP_GITHUB_TOKEN: 'tok', BACKUP_GITHUB_API: gh.url };
  const a = await startServer(env);
  try {
    const o = await a.call('POST', '/api/orders', orderBody({ name: 'Сохрани меня' }));
    assert.equal(o.status, 201);
    const A = await adminHeaders(a.call);
    const push = await a.call('POST', '/api/admin/offsite', {}, A);
    assert.equal(push.status, 200);
    assert.ok(gh.files.has('backups/drinkstar-latest.db') && gh.files.has('backups/orders-latest.csv'));
    assert.ok(gh.files.get('backups/orders-latest.csv').buf.toString().includes('Сохрани меня'));
    // новый сервис с пустым диском поднимает данные из копии
    const b = await startServer(env);
    try {
      const L = await b.call('POST', '/api/staff/login', { pin: '1234', locationId: 'all' });
      const list = await b.call('GET', '/api/staff/orders', undefined, { 'x-staff-token': L.json.token });
      assert.ok(list.json.some(x => x.name === 'Сохрани меня'), 'заказ должен вернуться из внешней копии');
    } finally { b.stop(); }
  } finally { a.stop(); gh.srv.close(); }
});
