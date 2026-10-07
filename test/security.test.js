// Тесты безопасности: проверяют типичные дыры. Каждый тест = одна найденная или закрытая уязвимость.
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, adminHeaders, orderBody } = require('./helpers');

let S, A;
before(async () => { S = await startServer(); A = await adminHeaders(S.call); });
after(() => S.stop());

describe('защитные заголовки', () => {
  test('на страницах есть CSP, запрет встраивания и защита от угадывания типов', async () => {
    const r = await S.call('GET', '/');
    const csp = r.headers.get('content-security-policy') || '';
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /script-src 'self'(?! 'unsafe-inline')/, 'скрипты только свои, без unsafe-inline');
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.ok(r.headers.get('permissions-policy'));
  });
  test('в страницах нет встроенных скриптов (иначе CSP бесполезна)', async () => {
    for (const p of ['/', '/staff.html', '/admin.html', '/track.html', '/legal.html', '/pay-mock.html']) {
      const html = (await S.call('GET', p)).text;
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].filter(m => m[1].trim());
      assert.equal(inline.length, 0, p + ' содержит встроенный скрипт');
    }
  });
  test('HSTS включается за HTTPS-прокси', async () => {
    const r = await S.call('GET', '/', undefined, { 'x-forwarded-proto': 'https' });
    assert.match(r.headers.get('strict-transport-security') || '', /max-age=\d{7,}/);
  });
});

describe('защита от подбора и подмены адреса', () => {
  test('поддельный X-Forwarded-For не даёт обойти лимит попыток входа персонала', async () => {
    let blocked = false;
    for (let i = 0; i < 16; i++) {
      const r = await S.call('POST', '/api/staff/login', { pin: 'x' + i + 'zz', locationId: 'all' }, { 'x-forwarded-for': `10.9.${i}.${i}` });
      if (r.status === 429) { blocked = true; break; }
    }
    assert.ok(blocked, 'после серии неверных PIN вход должен блокироваться, даже если менять X-Forwarded-For');
  });
  test('вход владельца: после серии неверных PIN блок, правильный PIN тоже ждёт', async () => {
    const s2 = await startServer();
    try {
      let blocked = false;
      for (let i = 0; i < 40; i++) {
        const r = await s2.call('POST', '/api/admin/login', { pin: 'bad' + i + 'pp' }, { 'x-forwarded-for': `10.8.${i}.1` });
        if (r.status === 429) { blocked = true; break; }
      }
      assert.ok(blocked, 'перебор PIN владельца должен упираться в общий лимит');
    } finally { s2.stop(); }
  });
});

describe('запросы и данные', () => {
  test('JSON-запросы принимаются только с Content-Type: application/json', async () => {
    const r = await S.call('POST', '/api/orders', JSON.stringify(orderBody()), { 'Content-Type': 'text/plain' });
    assert.equal(r.status, 415);
  });
  test('запросы с чужого сайта (Origin) отклоняются', async () => {
    const r = await S.call('POST', '/api/orders', orderBody(), { Origin: 'https://evil.example' });
    assert.equal(r.status, 403);
  });
  test('слишком большое тело отклоняется', async () => {
    const r = await S.call('POST', '/api/orders', JSON.stringify({ comment: 'x'.repeat(60000) }), { 'Content-Type': 'application/json' });
    assert.ok([400, 413].includes(r.status));
  });
  test('CSV-выгрузка не исполняет формулы Excel', async () => {
    await S.call('POST', '/api/orders', orderBody({ name: '=HYPERLINK("http://evil","click")' }));
    const csv = await S.call('GET', '/api/admin/orders.csv?days=1', undefined, A);
    assert.equal(csv.status, 200);
    assert.doesNotMatch(csv.text, /(^|;)=HYPERLINK/m, 'ячейка не должна начинаться с "="');
  });
  test('служебные символы из имён и комментариев вычищаются', async () => {
    const s2 = await startServer(); // отдельный сервер: на основном вход персонала заблокирован тестом выше
    try {
      const r = await s2.call('POST', '/api/orders', orderBody({ name: 'Айдар\r\nSet-Cookie: x=1', comment: 'a\u0000b\u0007c' }));
      assert.equal(r.status, 201);
      const L = await s2.call('POST', '/api/staff/login', { pin: '1234', locationId: 'all' });
      const list = await s2.call('GET', '/api/staff/orders', undefined, { 'x-staff-token': L.json.token });
      const o = list.json.find(x => x.token === r.json.token);
      assert.doesNotMatch(o.name, /[\r\n]/); assert.doesNotMatch(o.comment, /[\u0000-\u0008]/);
    } finally { s2.stop(); }
  });
});

describe('вход по SMS', () => {
  test('код из 6 цифр', async () => {
    const r = await S.call('POST', '/api/auth/request', { phone: '87019990001', consent: true });
    assert.match(r.json.demoCode, /^\d{6}$/);
  });
  test('перебор кода блокируется общим лимитом по номеру', async () => {
    const phone = '87019990002';
    let blocked = false;
    for (let i = 0; i < 40 && !blocked; i++) {
      const code = String(100000 + i);
      const rq = await S.call('POST', '/api/auth/request', { phone, consent: true }, { 'x-forwarded-for': `10.7.${i}.1` });
      if (rq.status === 429 && rq.json.error) { /* пауза между кодами */ }
      const v = await S.call('POST', '/api/auth/verify', { phone, code, consent: true }, { 'x-forwarded-for': `10.7.${i}.2` });
      if (v.status === 429) blocked = true;
    }
    assert.ok(blocked, 'после серии неверных кодов номер должен блокироваться');
  });
  test('номер нельзя заспамить заказами', async () => {
    let blocked = false;
    for (let i = 0; i < 14 && !blocked; i++) {
      const r = await S.call('POST', '/api/orders', orderBody({ phone: '+77017770001' }), { 'x-forwarded-for': `10.6.${i}.1` });
      if (r.status === 429) blocked = true;
    }
    assert.ok(blocked, 'один номер не должен создавать неограниченно заказов');
  });
});

describe('служебное', () => {
  test('healthz отвечает без авторизации', async () => {
    const r = await S.call('GET', '/healthz'); assert.equal(r.status, 200); assert.equal(r.json.ok, true);
  });
  test('файлы базы, исходники сервера и данные недоступны по HTTP', async () => {
    for (const p of ['/server.js', '/data/menu.json', '/lib/db.js', '/package.json', '/../server.js', '/%2e%2e/server.js', '/.env', '/drinkstar.db']) {
      const r = await S.call('GET', p); assert.equal(r.status, 404, p);
    }
  });
  test('старый вход владельца по PIN в заголовке отключён', async () => {
    const r = await S.call('GET', '/api/admin/stats?days=1', undefined, { 'x-admin-pin': '0000' });
    assert.equal(r.status, 401);
  });
});
