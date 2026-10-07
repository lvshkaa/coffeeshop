// Интеграционные тесты основной логики: заказы, клуб, бонусы, персонал, отзывы.
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, adminHeaders, orderBody } = require('./helpers');

let S, A;
before(async () => { S = await startServer(); A = await adminHeaders(S.call); });
after(() => S.stop());

describe('публичные данные', () => {
  test('меню, кофейни и настройки отдаются', async () => {
    const m = await S.call('GET', '/api/menu'); assert.equal(m.status, 200); assert.ok(m.json.categories.length >= 7);
    const l = await S.call('GET', '/api/locations'); assert.equal(l.json.length, 8);
    const c = await S.call('GET', '/api/config'); assert.equal(c.json.club.cashbackPercent, 5);
  });
});

describe('заказ гостя', () => {
  test('без согласия заказ не принимается', async () => {
    const r = await S.call('POST', '/api/orders', orderBody({ consent: false })); assert.equal(r.status, 400);
  });
  test('цену клиент задать не может: считает сервер', async () => {
    const r = await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'latte', v: 1, qty: 2, addons: [], price: 1 }] }));
    assert.equal(r.status, 201);
    const o = await S.call('GET', '/api/orders/' + r.json.token);
    assert.equal(o.json.total, 2 * 1190);
  });
  test('несуществующая позиция, добавка и позиция без цены отклоняются', async () => {
    assert.equal((await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'nope', v: 0, qty: 1 }] }))).status, 400);
    assert.equal((await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'latte', v: 0, qty: 1, addons: ['hack'] }] }))).status, 400);
    assert.equal((await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'panini', v: 0, qty: 1 }] }))).status, 400);
    assert.equal((await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'latte', v: 0, qty: -3 }] }))).status, 400);
  });
  test('гость платит за сироп, участник клуба нет', async () => {
    const r = await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'latte', v: 0, qty: 1, addons: ['syrup'] }] }));
    assert.equal((await S.call('GET', '/api/orders/' + r.json.token)).json.total, 1150 + 100);
  });
});

describe('клуб и бонусы', () => {
  let me;
  test('вход по коду из SMS, неверный код отклоняется', async () => {
    const req = await S.call('POST', '/api/auth/request', { phone: '8 701 555 00 01', consent: true });
    assert.equal(req.status, 200); assert.ok(req.json.demoCode);
    assert.equal((await S.call('POST', '/api/auth/verify', { phone: '87015550001', code: '0000', consent: true })).status, 400);
    const ok = await S.call('POST', '/api/auth/verify', { phone: '87015550001', code: req.json.demoCode, name: 'Клиент', consent: true });
    assert.equal(ok.status, 200); me = ok.json.customer; assert.equal(me.bonus, 0);
  });
  test('сироп бесплатно, кэшбэк 5% начисляется после выдачи', async () => {
    const o = await S.call('POST', '/api/orders', orderBody({ items: [{ id: 'latte', v: 1, qty: 2, addons: ['syrup'] }] }));
    const view = (await S.call('GET', '/api/orders/' + o.json.token)).json;
    assert.equal(view.total, 2380); assert.equal(view.cashback, 119);
    const L = await S.call('POST', '/api/staff/login', { pin: '1234', locationId: 'all' });
    const H = { 'x-staff-token': L.json.token };
    for (const s of ['preparing', 'ready', 'done']) assert.equal((await S.call('PATCH', '/api/staff/orders/' + o.json.token, { status: s }, H)).status, 200);
    assert.equal((await S.call('GET', '/api/me')).json.customer.bonus, 119);
  });
  test('бонусы списываются, при отмене возвращаются', async () => {
    const o = await S.call('POST', '/api/orders', orderBody({ useBonus: true }));
    const view = (await S.call('GET', '/api/orders/' + o.json.token)).json;
    assert.equal(view.bonusUsed, 119);
    assert.equal((await S.call('GET', '/api/me')).json.customer.bonus, 0);
    const L = await S.call('POST', '/api/staff/login', { pin: '1234', locationId: 'all' });
    await S.call('PATCH', '/api/staff/orders/' + o.json.token, { status: 'cancelled' }, { 'x-staff-token': L.json.token });
    assert.equal((await S.call('GET', '/api/me')).json.customer.bonus, 119);
  });
  test('удаление данных обезличивает аккаунт', async () => {
    assert.equal((await S.call('POST', '/api/me/delete', {})).status, 200);
    assert.equal((await S.call('GET', '/api/me')).json.customer, null);
  });
});

describe('персонал и смены', () => {
  let pin, H, other;
  test('владелец заводит бариста, PIN уникален', async () => {
    const c = await S.call('POST', '/api/admin/staff', { name: 'Мадина', role: 'barista' }, A);
    assert.equal(c.status, 201); pin = c.json.pin;
    assert.equal((await S.call('POST', '/api/admin/staff', { name: 'Дубль', pin }, A)).status, 409);
  });
  test('бариста входит только в выбранную кофейню и видит только её заказы', async () => {
    const L = await S.call('POST', '/api/staff/login', { pin, locationId: 'alfarabi5' });
    assert.equal(L.status, 200); H = { 'x-staff-token': L.json.token };
    assert.equal((await S.call('POST', '/api/staff/login', { pin, locationId: 'all' })).status, 400);
    const mine = await S.call('POST', '/api/orders', orderBody());
    other = await S.call('POST', '/api/orders', orderBody({ locationId: 'turan13' }));
    const list = await S.call('GET', '/api/staff/orders', undefined, H);
    assert.ok(list.json.every(o => o.locationId === 'alfarabi5'));
    assert.ok(list.json.some(o => o.token === mine.json.token));
  });
  test('чужой заказ менять нельзя, без токена нельзя ничего', async () => {
    assert.equal((await S.call('PATCH', '/api/staff/orders/' + other.json.token, { status: 'preparing' }, H)).status, 403);
    assert.equal((await S.call('GET', '/api/staff/orders')).status, 401);
    assert.equal((await S.call('GET', '/api/staff/orders', undefined, { 'x-staff-pin': '1234' })).status, 401);
  });
  test('отключённый сотрудник теряет доступ сразу', async () => {
    const list = await S.call('GET', '/api/admin/staff', undefined, A);
    const id = list.json.find(s => s.name === 'Мадина').id;
    await S.call('PATCH', '/api/admin/staff/' + id, { active: false }, A);
    assert.equal((await S.call('GET', '/api/staff/me', undefined, H)).status, 401);
  });
});

describe('отзывы', () => {
  let token;
  test('отзыв только на выданный заказ, один на заказ, текст не исполняется', async () => {
    const o = await S.call('POST', '/api/orders', orderBody()); token = o.json.token;
    assert.equal((await S.call('POST', `/api/orders/${token}/review`, { rating: 5 })).status, 400);
    const L = await S.call('POST', '/api/staff/login', { pin: '1234', locationId: 'all' });
    for (const s of ['preparing', 'ready', 'done']) await S.call('PATCH', '/api/staff/orders/' + token, { status: s }, { 'x-staff-token': L.json.token });
    assert.equal((await S.call('POST', `/api/orders/${token}/review`, { rating: 9 })).status, 400);
    assert.equal((await S.call('POST', `/api/orders/${token}/review`, { rating: 5, text: '<img src=x onerror=alert(1)>' })).status, 201);
    assert.equal((await S.call('POST', `/api/orders/${token}/review`, { rating: 1 })).status, 409);
    const pub = await S.call('GET', '/api/reviews');
    assert.equal(pub.json.count, 1); assert.equal(pub.json.items[0].name, 'Айдар');
  });
  test('владелец может скрыть отзыв', async () => {
    const all = await S.call('GET', '/api/admin/reviews', undefined, A);
    await S.call('PATCH', '/api/admin/reviews/' + all.json[0].id, { status: 'hidden' }, A);
    assert.equal((await S.call('GET', '/api/reviews')).json.count, 0);
  });
});

describe('аналитика владельца', () => {
  test('без входа закрыта, со входом отдаёт цифры', async () => {
    assert.equal((await S.call('GET', '/api/admin/stats?days=7')).status, 401);
    const s = await S.call('GET', '/api/admin/stats?days=7', undefined, A);
    assert.equal(s.status, 200); assert.ok(s.json.totals.orders >= 1);
  });
});

describe('меню владельца', () => {
  test('владелец добавляет и удаляет свою позицию, CSV отдаётся как текст', async () => {
    const s = await startServer();
    try {
      const A = await adminHeaders(s.call);
      const add = await s.call('POST', '/api/admin/menu/items', { category: 'coffee', name: 'Тест-латте', variants: [{ label: '0,3', price: 999 }] }, A);
      assert.equal(add.status, 201);
      const menu = await s.call('GET', '/api/menu');
      assert.ok(menu.json.categories.find(c => c.id === 'coffee').items.some(i => i.id === add.json.id && i.variants[0].price === 999));
      const del = await s.call('DELETE', '/api/admin/menu/items/' + add.json.id, undefined, A);
      assert.equal(del.status, 200);
      const again = await s.call('GET', '/api/menu');
      assert.ok(!again.json.categories.find(c => c.id === 'coffee').items.some(i => i.id === add.json.id));
      const csv = await s.call('GET', '/api/admin/orders.csv?days=1', undefined, A);
      assert.ok(csv.text.includes("Номер;Дата"));
    } finally { s.stop(); }
  });
});
