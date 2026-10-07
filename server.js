// DrinkStar: сайт + онлайн-заказ + оплата + клуб + экран персонала + аналитика. Без внешних зависимостей.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { open, tx } = require('./lib/db');

const PORT = process.env.PORT || 3000;
const DEFAULT_STAFF_PIN = '1234';
const DEFAULT_ADMIN_PIN = '0000';
const STAFF_PIN = process.env.STAFF_PIN || DEFAULT_STAFF_PIN;
const ADMIN_PIN = process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN;
const PUB = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const PAY_TTL = 15 * 60 * 1000;            // неоплаченный онлайн-заказ отменяется через 15 минут
const SESSION_TTL = 90 * 24 * 3600 * 1000; // вход в клуб держится 90 дней
const CODE_TTL = 5 * 60 * 1000;
const TZ_OFFSET_H = 5;                     // Астана, UTC+5

if (process.env.NODE_ENV === 'production') {
  if (STAFF_PIN === DEFAULT_STAFF_PIN || ADMIN_PIN === DEFAULT_ADMIN_PIN || STAFF_PIN === ADMIN_PIN) {
    console.error('Остановлено: в боевом режиме задайте разные STAFF_PIN и ADMIN_PIN (не 1234 и не 0000).');
    process.exit(1);
  }
}

const readJson = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const menu = readJson('menu.json');
const locations = readJson('locations.json');
const club = readJson('club.json');
const company = readJson('company.json');

// --- сообщения об ошибках для клиента на ru/kk/en (язык приходит в заголовке x-lang) ---
const ERR = {
  needName: ['Укажите имя', 'Атыңызды жазыңыз', 'Please enter your name'],
  needPhone: ['Укажите телефон', 'Телефон нөміріңізді жазыңыз', 'Please enter your phone number'],
  needLoc: ['Выберите кофейню', 'Кофеханаңызды таңдаңыз', 'Please choose a coffee shop'],
  closed: ['Эта кофейня сейчас закрыта ({o}–{c})', 'Бұл кофехана қазір жабық ({o}–{c})', 'This coffee shop is closed right now ({o}–{c})'],
  emptyCart: ['Корзина пуста', 'Себет бос', 'Your cart is empty'],
  badItem: ['Некорректная позиция в корзине', 'Себеттегі позиция дұрыс емес', 'Invalid item in the cart'],
  badAddon: ['Некорректная добавка', 'Қосымша дұрыс емес', 'Invalid add-on'],
  noBonus: ['Недостаточно бонусов', 'Бонус жеткіліксіз', 'Not enough bonuses'],
  payFail: ['Не удалось создать платёж. Попробуйте оплату на кассе.', 'Төлем жасау мүмкін болмады. Кассада төлеп көріңіз.', 'Could not create the payment. Try paying at the counter.'],
  tooManyOrders: ['Слишком много заказов, попробуйте позже', 'Тапсырыс тым көп, кейінірек қайталаңыз', 'Too many orders, please try again later'],
  phoneFull: ['Введите номер телефона полностью', 'Телефон нөмірін толық енгізіңіз', 'Enter the full phone number'],
  tooManyReq: ['Слишком много запросов, попробуйте позже', 'Сұрау тым көп, кейінірек қайталаңыз', 'Too many requests, please try again later'],
  codeSent: ['Код уже отправлен. Повторить можно через минуту.', 'Код жіберілді. Бір минуттан кейін қайталауға болады.', 'The code was already sent. You can resend it in a minute.'],
  smsFail: ['Не удалось отправить SMS. Попробуйте позже.', 'SMS жіберілмеді. Кейінірек қайталаңыз.', 'Could not send the SMS. Please try later.'],
  codeExpired: ['Код истёк. Запросите новый.', 'Кодтың мерзімі өтті. Жаңасын сұраңыз.', 'The code has expired. Request a new one.'],
  tooManyAttempts: ['Слишком много попыток. Запросите новый код.', 'Әрекет тым көп. Жаңа код сұраңыз.', 'Too many attempts. Request a new code.'],
  wrongCode: ['Неверный код', 'Код дұрыс емес', 'Wrong code'],
  noOrder: ['Заказ не найден', 'Тапсырыс табылмады', 'Order not found'],
  forbidden: ['Запрещено', 'Тыйым салынған', 'Forbidden'],
  needConsent: ['Подтвердите согласие с условиями', 'Шарттармен келісімді растаңыз', 'Please accept the terms to continue'],
  notLoggedIn: ['Войдите в клуб', 'Клубқа кіріңіз', 'Please sign in'],
  needDone: ['Отзыв можно оставить после получения заказа', 'Тапсырысты алғаннан кейін пікір қалдыруға болады', 'You can leave a review after you have collected your order'],
  reviewExists: ['Вы уже оставили отзыв на этот заказ', 'Бұл тапсырысқа пікір қалдырып қойдыңыз', 'You have already reviewed this order'],
  badRating: ['Поставьте оценку от 1 до 5', '1-ден 5-ке дейін баға қойыңыз', 'Please give a rating from 1 to 5'],
  tooManyReviews: ['Слишком много отзывов, попробуйте позже', 'Пікір тым көп, кейінірек қайталаңыз', 'Too many reviews, please try again later']
};
const langOf = req => { const l = String(req.headers['x-lang'] || ''); return ['ru', 'kk', 'en'].includes(l) ? l : 'ru'; };
function E(x, key, vars) {
  const i = ['ru', 'kk', 'en'].indexOf(typeof x === 'string' ? x : langOf(x));
  let m = ERR[key][i < 0 ? 0 : i];
  for (const k in vars || {}) m = m.split('{' + k + '}').join(vars[k]);
  return m;
}

const items = new Map();
menu.categories.forEach(c => c.items.forEach(i => items.set(i.id, i)));
const addons = new Map(menu.addons.map(a => [a.id, a]));
const locById = new Map(locations.map(l => [l.id, l]));

// --- подключаемые провайдеры: payments/<имя>.js и sms/<имя>.js ---
function loadProvider(dir, name, what) {
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(path.join(__dirname, dir, name + '.js'))) {
    console.error(`Нет ${what} "${name}" в папке ${dir}/`); process.exit(1);
  }
  return require('./' + dir + '/' + name);
}
const payName = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
const provider = payName === 'none' ? null : loadProvider('payments', payName, 'платёжного провайдера');
const sms = loadProvider('sms', (process.env.SMS_PROVIDER || 'demo').toLowerCase(), 'SMS-провайдера');

const db = open(process.env.DATA_DIR || DATA);

// --- сотрудники: личные аккаунты бариста со сменами ---
const metaGet = k => db.prepare('SELECT value FROM meta WHERE key = ?').get(k)?.value;
if (!metaGet('pin_secret')) db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('pin_secret', crypto.randomBytes(32).toString('hex'));
const PIN_SECRET = metaGet('pin_secret');
const hashPin = pin => crypto.createHmac('sha256', PIN_SECRET).update(String(pin)).digest('hex');
const STAFF_SESSION_TTL = 14 * 3600e3;
// первый запуск: STAFF_PIN становится PIN менеджера; бариста владелец заводит в аналитике
if (db.prepare('SELECT COUNT(*) n FROM staff').get().n === 0) {
  db.prepare('INSERT INTO staff (name, pin_hash, role, active, created_at) VALUES (?,?,?,?,?)').run('Менеджер', hashPin(STAFF_PIN), 'manager', 1, Date.now());
}
const STATUSES = ['new', 'preparing', 'ready', 'done', 'cancelled'];
const ACTIVE = ['new', 'preparing', 'ready'];

// --- утилиты ---
function astanaMinutes() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value;
}
const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
const isOpen = l => { const n = astanaMinutes(); return n >= toMin(l.open) && n < toMin(l.close); };
const dayStart = ts => Math.floor((ts + TZ_OFFSET_H * 3600e3) / 86400e3) * 86400e3 - TZ_OFFSET_H * 3600e3;

const SEC_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };
function send(res, code, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(code, { 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...SEC_HEADERS, ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
function readRaw(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 20000) { reject(new Error('too big')); req.destroy(); } });
    req.on('end', () => resolve(d));
  });
}
async function readBody(req) {
  const raw = await readRaw(req);
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error('bad json'); }
}
const baseUrl = req => process.env.BASE_URL || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
const clientIp = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, v.join('=')]));

// скользящее окно: не больше max событий за windowMs на ключ
const buckets = new Map();
function hit(key, windowMs, max) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now); buckets.set(key, arr);
  return arr.length > max;
}
// PIN от перебора: 8 неверных попыток за 5 минут -> блок
function pinAuth(req, pin, bucket) {
  const ip = clientIp(req), key = bucket + ip, now = Date.now();
  const fails = (buckets.get(key) || []).filter(t => now - t < 5 * 60 * 1000);
  if (fails.length >= 8) return 'blocked';
  const header = bucket === 'admin' ? 'x-admin-pin' : 'x-staff-pin';
  const a = Buffer.from(String(req.headers[header] || '')), b = Buffer.from(pin);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) { fails.push(now); buckets.set(key, fails); }
  return ok ? 'ok' : 'bad';
}

// --- бонусы: единственное место, где меняется баланс ---
function adjustBonus(customerId, delta, reason, orderToken) {
  db.prepare('UPDATE customers SET bonus = bonus + ? WHERE id = ?').run(delta, customerId);
  db.prepare('INSERT INTO bonus_tx (customer_id, delta, reason, order_token, created_at) VALUES (?,?,?,?,?)').run(customerId, delta, reason, orderToken || null, Date.now());
}

// --- представление заказа ---
const rowToOrder = r => ({
  token: r.token, number: r.number, locationId: r.location_id, status: r.status, createdAt: r.created_at,
  name: r.name, phone: r.phone, comment: r.comment, payment: r.payment, paid: !!r.paid,
  items: JSON.parse(r.items), total: r.total, bonusUsed: r.bonus_used, payable: r.payable,
  cashback: r.cashback, member: !!r.customer_id
});
const reviewOf = token => db.prepare('SELECT rating, text, reply FROM reviews WHERE order_token = ?').get(token) || null;
const publicOrder = r => {
  const o = rowToOrder(r);
  return {
    number: o.number, status: o.status, items: o.items, total: o.total, name: o.name, payment: o.payment, paid: o.paid,
    bonusUsed: o.bonusUsed, payable: o.payable, member: o.member,
    cashback: o.member && r.status !== 'cancelled' && !r.cashback_done ? o.cashback : 0,
    cashbackDone: !!r.cashback_done,
    payUrl: r.status === 'awaiting_payment' ? r.pay_url : undefined,
    review: reviewOf(r.token), canReview: r.status === 'done' && !reviewOf(r.token),
    location: locById.get(o.locationId)?.address, createdAt: o.createdAt
  };
};

// --- смена статуса: возвраты и начисления бонусов ---
function setStatus(token, status, staffId) {
  return tx(db, () => {
    const o = db.prepare('SELECT * FROM orders WHERE token = ?').get(token);
    if (!o) return false;
    if (status === 'cancelled' && o.status !== 'cancelled' && o.bonus_used > 0 && !o.bonus_refunded) {
      adjustBonus(o.customer_id, o.bonus_used, 'refund', token);
      db.prepare('UPDATE orders SET bonus_refunded = 1 WHERE token = ?').run(token);
    }
    if (status === 'done' && o.customer_id && o.cashback > 0 && !o.cashback_done) {
      adjustBonus(o.customer_id, o.cashback, 'cashback', token);
      db.prepare('UPDATE orders SET cashback_done = 1 WHERE token = ?').run(token);
    }
    db.prepare('UPDATE orders SET status = ? WHERE token = ?').run(status, token);
    if (staffId) {
      const now = Date.now();
      if (status === 'preparing') db.prepare('UPDATE orders SET accepted_by = COALESCE(accepted_by, ?), accepted_at = COALESCE(accepted_at, ?) WHERE token = ?').run(staffId, now, token);
      if (status === 'ready') db.prepare('UPDATE orders SET ready_by = ?, ready_at = ? WHERE token = ?').run(staffId, now, token);
      if (status === 'done') db.prepare('UPDATE orders SET done_by = ?, done_at = ? WHERE token = ?').run(staffId, now, token);
    }
    return true;
  });
}
// оплата подтверждена провайдером или демо-страницей: заказ уходит бариста
function markPaid(token) {
  tx(db, () => {
    const o = db.prepare('SELECT * FROM orders WHERE token = ?').get(token);
    if (!o || o.paid) return;
    if (o.status === 'awaiting_payment') db.prepare("UPDATE orders SET status = 'new' WHERE token = ?").run(token);
    else if (o.status === 'cancelled' && o.expired) {
      // деньги пришли уже после отмены: оживляем заказ и снова списываем бонусы (баланс может уйти в минус, это честный учёт)
      db.prepare("UPDATE orders SET status = 'new', expired = 0 WHERE token = ?").run(token);
      if (o.bonus_refunded && o.bonus_used > 0) {
        adjustBonus(o.customer_id, -o.bonus_used, 'order', token);
        db.prepare('UPDATE orders SET bonus_refunded = 0 WHERE token = ?').run(token);
      }
    }
    db.prepare('UPDATE orders SET paid = 1, paid_at = ? WHERE token = ?').run(Date.now(), token);
  });
}
function sweep() {
  const cut = Date.now() - STAFF_SESSION_TTL;
  db.prepare('UPDATE shifts SET ended_at = started_at + ? WHERE ended_at IS NULL AND started_at < ?').run(STAFF_SESSION_TTL, cut);
  db.prepare('DELETE FROM staff_sessions WHERE expires_at < ?').run(Date.now());
  const old = db.prepare("SELECT token FROM orders WHERE status = 'awaiting_payment' AND created_at < ?").all(Date.now() - PAY_TTL);
  for (const { token } of old) {
    setStatus(token, 'cancelled');
    db.prepare('UPDATE orders SET expired = 1 WHERE token = ?').run(token);
  }
}

// --- вход в клуб ---
function normPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) d = '7' + d;
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  return /^7\d{10}$/.test(d) ? d : null;
}
function currentCustomer(req) {
  const t = cookies(req).ds_session;
  if (!t) return null;
  return db.prepare('SELECT c.* FROM sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > ?').get(sha(t), Date.now()) || null;
}
const sessionCookie = (req, value, maxAgeSec) =>
  `ds_session=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${baseUrl(req).startsWith('https') ? '; Secure' : ''}`;

const addonPrice = (a, member) => (member && club.freeSyrup && a.id === club.syrupAddonId ? 0 : a.price);

// --- заказ: цены и бонусы считает сервер, клиенту не верим ---
function priceOrder(body, customer, lang) {
  const member = !!customer;
  const name = String(body.name || customer?.name || '').trim().slice(0, 60);
  const phone = member ? customer.phone : String(body.phone || '').replace(/[^\d+]/g, '');
  const comment = String(body.comment || '').trim().slice(0, 300);
  const loc = locById.get(body.locationId);
  if (!name) return { error: E(lang, 'needName') };
  if (phone.replace(/\D/g, '').length < 10) return { error: E(lang, 'needPhone') };
  if (!loc) return { error: E(lang, 'needLoc') };
  if (!isOpen(loc)) return { error: E(lang, 'closed', { o: loc.open, c: loc.close }) };
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30) return { error: E(lang, 'emptyCart') };

  let total = 0;
  const lines = [];
  for (const l of body.items) {
    const item = items.get(l.id);
    const variant = item?.variants[l.v | 0];
    const qty = l.qty | 0;
    if (!item || !variant || typeof variant.price !== 'number' || qty < 1 || qty > 20) return { error: E(lang, 'badItem') };
    const ads = [...new Set(Array.isArray(l.addons) ? l.addons : [])].map(id => addons.get(id));
    if (ads.some(a => !a)) return { error: E(lang, 'badAddon') };
    const unit = variant.price + ads.reduce((s, a) => s + addonPrice(a, member), 0);
    total += unit * qty;
    lines.push({ id: item.id, name: item.name, variant: variant.label, qty, addons: ads.map(a => a.name), addonIds: ads.map(a => a.id), unit });
  }
  let bonusUsed = 0;
  if (member && body.useBonus) {
    bonusUsed = Math.max(0, Math.min(customer.bonus, Math.floor(total * club.maxBonusPercent / 100)));
  }
  const payable = total - bonusUsed;
  const cashback = member ? Math.floor(payable * club.cashbackPercent / 100) : 0;
  let payment = body.payment === 'online' && provider ? 'online' : 'cash';
  if (payable === 0) payment = 'bonus';
  return { order: { name, phone, comment, locationId: loc.id, items: lines, total, bonusUsed, payable, cashback, payment } };
}

// --- аналитика ---
function stats(days, locId) {
  const to = Date.now();
  const from = dayStart(to) - (days - 1) * 86400e3;
  const rows = db.prepare("SELECT * FROM orders WHERE created_at >= ? AND status NOT IN ('cancelled','awaiting_payment') ORDER BY created_at").all(from)
    .filter(r => !locId || r.location_id === locId);
  const t = { orders: rows.length, revenue: 0, money: 0, bonusSpent: 0, cashbackAccrued: 0, online: 0, cash: 0, members: 0 };
  const byLoc = {}, byDay = {}, byHour = Array.from({ length: 24 }, () => ({ orders: 0, revenue: 0 })), top = {}, memberOrders = {};
  for (const r of rows) {
    t.revenue += r.total; t.money += r.payable; t.bonusSpent += r.bonus_used;
    if (r.cashback_done) t.cashbackAccrued += r.cashback;
    if (r.payment === 'online') t.online++; else if (r.payment === 'cash') t.cash++;
    if (r.customer_id) { t.members++; memberOrders[r.customer_id] = (memberOrders[r.customer_id] || 0) + 1; }
    const L = byLoc[r.location_id] ||= { id: r.location_id, address: locById.get(r.location_id)?.address || r.location_id, orders: 0, revenue: 0 };
    L.orders++; L.revenue += r.total;
    const local = r.created_at + TZ_OFFSET_H * 3600e3;
    const day = new Date(local).toISOString().slice(0, 10);
    const D = byDay[day] ||= { date: day, orders: 0, revenue: 0 };
    D.orders++; D.revenue += r.total;
    const H = byHour[new Date(local).getUTCHours()]; H.orders++; H.revenue += r.total;
    for (const i of JSON.parse(r.items)) {
      const k = i.name + (i.variant ? ' ' + i.variant : '');
      const T = top[k] ||= { id: i.id, variant: i.variant, name: k, qty: 0, revenue: 0 };
      T.qty += i.qty; T.revenue += i.unit * i.qty;
    }
  }
  const days_ = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from + i * 86400e3 + TZ_OFFSET_H * 3600e3).toISOString().slice(0, 10);
    days_.push(byDay[d] || { date: d, orders: 0, revenue: 0 });
  }
  return {
    days, totals: { ...t, avgCheck: t.orders ? Math.round(t.revenue / t.orders) : 0 },
    byLocation: Object.values(byLoc).sort((a, b) => b.revenue - a.revenue),
    byDay: days_, byHour,
    topItems: Object.values(top).sort((a, b) => b.qty - a.qty).slice(0, 10),
    reviews: (() => {
      const r = db.prepare("SELECT COUNT(*) n, COALESCE(AVG(rating), 0) a FROM reviews WHERE created_at >= ? AND status = 'published'").get(from);
      return { count: r.n, avg: Math.round(r.a * 10) / 10 };
    })(),
    staff: db.prepare(`SELECT s.id, s.name, COUNT(*) orders, ROUND(AVG(o.ready_at - o.created_at) / 60000.0, 1) avgMin
        FROM orders o JOIN staff s ON s.id = o.ready_by
        WHERE o.created_at >= ? AND o.ready_at IS NOT NULL${locId ? ' AND o.location_id = ?' : ''}
        GROUP BY s.id ORDER BY orders DESC`).all(...(locId ? [from, locId] : [from])).map(r => ({ id: r.id, name: r.name, orders: r.orders, avgMin: r.avgMin })),
    club: {
      totalMembers: db.prepare('SELECT COUNT(*) n FROM customers').get().n,
      newMembers: db.prepare('SELECT COUNT(*) n FROM customers WHERE created_at >= ?').get(from).n,
      repeatMembers: Object.values(memberOrders).filter(n => n >= 2).length,
      bonusOutstanding: db.prepare('SELECT COALESCE(SUM(bonus),0) n FROM customers').get().n
    }
  };
}
const csvCell = v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function ordersCsv(days) {
  const from = dayStart(Date.now()) - (days - 1) * 86400e3;
  const rows = db.prepare('SELECT * FROM orders WHERE created_at >= ? ORDER BY created_at').all(from);
  const head = ['Номер', 'Дата (Астана)', 'Кофейня', 'Статус', 'Оплата', 'Клуб', 'Имя', 'Телефон', 'Сумма', 'Бонусами', 'Деньгами', 'Кэшбэк', 'Состав'];
  const lines = rows.map(r => [r.number, new Date(r.created_at + TZ_OFFSET_H * 3600e3).toISOString().replace('T', ' ').slice(0, 16),
    locById.get(r.location_id)?.address, r.status, r.payment, r.customer_id ? 'да' : 'нет', r.name, '+' + r.phone.replace(/\D/g, ''),
    r.total, r.bonus_used, r.payable, r.cashback_done ? r.cashback : 0,
    JSON.parse(r.items).map(i => `${i.qty}x ${i.name} ${i.variant}${i.addons.length ? ' (' + i.addons.join(', ') + ')' : ''}`).join('; ')]);
  return '﻿' + [head, ...lines].map(l => l.map(csvCell).join(';')).join('\r\n');
}

// --- личные аккаунты персонала ---
function staffFrom(req) {
  const t = String(req.headers['x-staff-token'] || '');
  if (!t) return null;
  return db.prepare(`SELECT s.id, s.name, s.role, ss.shift_id, sh.location_id AS loc, sh.started_at
      FROM staff_sessions ss JOIN staff s ON s.id = ss.staff_id LEFT JOIN shifts sh ON sh.id = ss.shift_id
      WHERE ss.token_hash = ? AND ss.expires_at > ? AND s.active = 1`).get(sha(t), Date.now()) || null;
}
function randomPin() {
  for (let i = 0; i < 100; i++) {
    const pin = String(crypto.randomInt(1000, 10000));
    if (!db.prepare('SELECT 1 FROM staff WHERE pin_hash = ?').get(hashPin(pin))) return pin;
  }
  throw new Error('нет свободных PIN');
}
function endShift(id) { if (id) db.prepare('UPDATE shifts SET ended_at = ? WHERE id = ? AND ended_at IS NULL').run(Date.now(), id); }

// --- API ---
async function api(req, res, url) {
  const p = url.pathname;
  sweep();

  // защита от запросов с чужих сайтов: изменения принимаем только со своего адреса
  if (req.method !== 'GET' && p !== '/api/payments/webhook') {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return send(res, 403, { error: E(req, 'forbidden') });
  }

  if (req.method === 'GET' && p === '/api/menu') return send(res, 200, menu);
  if (req.method === 'GET' && p === '/api/locations') return send(res, 200, locations);
  if (req.method === 'GET' && p === '/api/config') {
    return send(res, 200, {
      onlinePayment: !!provider, paymentLabel: provider?.label || '', demoPayment: provider?.name === 'mock',
      club: { name: club.name, cashbackPercent: club.cashbackPercent, maxBonusPercent: club.maxBonusPercent, freeSyrup: club.freeSyrup, syrupAddonId: club.syrupAddonId },
      demoSms: !!sms.demo,
      company: { name: company.name, bin: company.bin, address: company.address, phone: company.phone, email: company.email, storage: company.storage, legalVersion: company.legalVersion, draft: !!company.draft }
    });
  }

  // ---- клуб: вход по телефону и коду ----
  if (req.method === 'POST' && p === '/api/auth/request') {
    const reqBody = await readBody(req);
    const phone = normPhone(reqBody.phone);
    if (!phone) return send(res, 400, { error: E(req, 'phoneFull') });
    if (reqBody.consent !== true) return send(res, 400, { error: E(req, 'needConsent') });
    if (hit('sms-ip' + clientIp(req), 3600e3, 10)) return send(res, 429, { error: E(req, 'tooManyReq') });
    const prev = db.prepare('SELECT sent_at FROM sms_codes WHERE phone = ?').get(phone);
    if (prev && Date.now() - prev.sent_at < 60e3) return send(res, 429, { error: E(req, 'codeSent') });
    const code = String(crypto.randomInt(1000, 10000));
    try { await sms.send(phone, code); }
    catch (e) { console.error('SMS не отправлено:', e.message); return send(res, 502, { error: E(req, 'smsFail') }); }
    db.prepare('INSERT OR REPLACE INTO sms_codes (phone, code_hash, expires_at, attempts, sent_at) VALUES (?,?,?,?,?)')
      .run(phone, sha(phone + ':' + code), Date.now() + CODE_TTL, 0, Date.now());
    return send(res, 200, { ok: true, demoCode: sms.demo ? code : undefined });
  }
  if (req.method === 'POST' && p === '/api/auth/verify') {
    const body = await readBody(req);
    if (body.consent !== true) return send(res, 400, { error: E(req, 'needConsent') });
    const phone = normPhone(body.phone);
    const row = phone && db.prepare('SELECT * FROM sms_codes WHERE phone = ?').get(phone);
    if (!row || row.expires_at < Date.now()) return send(res, 400, { error: E(req, 'codeExpired') });
    if (row.attempts >= 5) return send(res, 429, { error: E(req, 'tooManyAttempts') });
    db.prepare('UPDATE sms_codes SET attempts = attempts + 1 WHERE phone = ?').run(phone);
    const given = Buffer.from(sha(phone + ':' + String(body.code || '').trim())), want = Buffer.from(row.code_hash);
    if (!crypto.timingSafeEqual(given, want)) return send(res, 400, { error: E(req, 'wrongCode') });
    db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(phone);
    let c = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    const name = String(body.name || '').trim().slice(0, 60);
    if (!c) {
      const id = db.prepare('INSERT INTO customers (phone, name, created_at) VALUES (?,?,?)').run(phone, name, Date.now()).lastInsertRowid;
      c = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    } else if (!c.name && name) { db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, c.id); c.name = name; }
    db.prepare('UPDATE customers SET consent_at = ?, consent_version = ?, marketing = ? WHERE id = ?').run(Date.now(), company.legalVersion, body.marketing === true ? 1 : 0, c.id);
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token_hash, customer_id, expires_at) VALUES (?,?,?)').run(sha(token), c.id, Date.now() + SESSION_TTL);
    return send(res, 200, { ok: true, customer: { name: c.name, phone: c.phone, bonus: c.bonus } }, { 'Set-Cookie': sessionCookie(req, token, SESSION_TTL / 1000) });
  }
  if (req.method === 'POST' && p === '/api/auth/logout') {
    const t = cookies(req).ds_session;
    if (t) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  }
  if (p === '/api/me') {
    const c = currentCustomer(req);
    if (!c) return send(res, 200, { customer: null });
    if (req.method === 'PATCH') {
      const name = String((await readBody(req)).name || '').trim().slice(0, 60);
      if (name) { db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, c.id); c.name = name; }
    }
    const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10').all(c.id)
      .map(r => ({ token: r.token, ...publicOrder(r) }));
    const history = db.prepare('SELECT delta, reason, created_at FROM bonus_tx WHERE customer_id = ? ORDER BY id DESC LIMIT 20').all(c.id);
    return send(res, 200, { customer: { name: c.name, phone: c.phone, bonus: c.bonus }, orders, history });
  }

  // ---- удаление аккаунта и персональных данных ----
  if (req.method === 'POST' && p === '/api/me/delete') {
    const c = currentCustomer(req);
    if (!c) return send(res, 401, { error: E(req, 'notLoggedIn') });
    tx(db, () => {
      // заказы остаются для учёта, но без персональных данных
      db.prepare("UPDATE orders SET name = '', phone = '', comment = '', customer_id = NULL WHERE customer_id = ?").run(c.id);
      db.prepare("UPDATE reviews SET name = '', customer_id = NULL WHERE customer_id = ?").run(c.id);
      db.prepare('DELETE FROM bonus_tx WHERE customer_id = ?').run(c.id);
      db.prepare('DELETE FROM sessions WHERE customer_id = ?').run(c.id);
      db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(c.phone);
      db.prepare('DELETE FROM customers WHERE id = ?').run(c.id);
    });
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  }

  // ---- заказы ----
  if (req.method === 'POST' && p === '/api/orders') {
    if (hit('order' + clientIp(req), 10 * 60e3, 10)) return send(res, 429, { error: E(req, 'tooManyOrders') });
    const customer = currentCustomer(req);
    const orderBody = await readBody(req);
    if (orderBody.consent !== true) return send(res, 400, { error: E(req, 'needConsent') });
    const { order, error } = priceOrder(orderBody, customer, langOf(req));
    if (error) return send(res, 400, { error });
    const token = crypto.randomBytes(9).toString('hex');
    const now = Date.now();
    try {
      tx(db, () => {
        const number = db.prepare('SELECT COUNT(*) n FROM orders WHERE location_id = ? AND created_at >= ?').get(order.locationId, dayStart(now)).n + 1;
        if (order.bonusUsed > 0) {
          const bal = db.prepare('SELECT bonus FROM customers WHERE id = ?').get(customer.id).bonus;
          if (bal < order.bonusUsed) throw new Error(E(req, 'noBonus'));
          adjustBonus(customer.id, -order.bonusUsed, 'order', token);
        }
        const status = order.payment === 'online' ? 'awaiting_payment' : 'new';
        db.prepare(`INSERT INTO orders (token, number, location_id, status, created_at, name, phone, comment, payment, paid, items, total, bonus_used, payable, cashback, customer_id, consent_version)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(token, number, order.locationId, status, now, order.name, order.phone, order.comment, order.payment,
            order.payment === 'bonus' ? 1 : 0, JSON.stringify(order.items), order.total, order.bonusUsed, order.payable, order.cashback, customer?.id ?? null, company.legalVersion);
      });
    } catch (e) { return send(res, 400, { error: e.message }); }
    if (customer && !customer.name && order.name) db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(order.name, customer.id);

    let payUrl;
    if (order.payment === 'online') {
      try {
        // провайдеру уходит сумма к оплате деньгами (уже за вычетом бонусов)
        const pay = await provider.createPayment({ token, number: 0, total: order.payable, grossTotal: order.total, name: order.name, phone: order.phone, items: order.items }, { baseUrl: baseUrl(req) });
        payUrl = pay.url;
        db.prepare('UPDATE orders SET pay_url = ?, external_id = ? WHERE token = ?').run(pay.url, pay.externalId || null, token);
      } catch (e) {
        console.error('Ошибка создания платежа:', e.message);
        setStatus(token, 'cancelled');
        return send(res, 502, { error: E(req, 'payFail') });
      }
    }
    const number = db.prepare('SELECT number FROM orders WHERE token = ?').get(token).number;
    return send(res, 201, { token, number, payUrl });
  }

  const track = p.match(/^\/api\/orders\/([a-f0-9]+)$/);
  if (req.method === 'GET' && track) {
    const r = db.prepare('SELECT * FROM orders WHERE token = ?').get(track[1]);
    return r ? send(res, 200, publicOrder(r)) : send(res, 404, { error: E(req, 'noOrder') });
  }

  // уведомление от настоящего провайдера об оплате
  if (req.method === 'POST' && p === '/api/payments/webhook') {
    if (!provider || provider.name === 'mock') return send(res, 404, { error: 'Не найдено' });
    try {
      const { token, paid } = await provider.handleWebhook(req, await readRaw(req));
      if (paid) markPaid(token);
      return send(res, 200, { ok: true });
    } catch (e) {
      console.error('Webhook отклонён:', e.message);
      return send(res, 400, { error: 'invalid' });
    }
  }
  // демо-оплата (только PAYMENT_PROVIDER=mock)
  const mock = p.match(/^\/api\/mock-pay\/([a-f0-9]+)$/);
  if (req.method === 'POST' && mock) {
    if (provider?.name !== 'mock') return send(res, 404, { error: 'Не найдено' });
    const r = db.prepare("SELECT token FROM orders WHERE token = ? AND payment = 'online'").get(mock[1]);
    if (!r) return send(res, 404, { error: E(req, 'noOrder') });
    markPaid(r.token);
    return send(res, 200, { ok: true });
  }

  // ---- отзывы ----
  const rv = p.match(/^\/api\/orders\/([a-f0-9]+)\/review$/);
  if (req.method === 'POST' && rv) {
    if (hit('review' + clientIp(req), 3600e3, 5)) return send(res, 429, { error: E(req, 'tooManyReviews') });
    const o = db.prepare('SELECT * FROM orders WHERE token = ?').get(rv[1]);
    if (!o) return send(res, 404, { error: E(req, 'noOrder') });
    const body = await readBody(req);
    const rating = body.rating | 0;
    if (rating < 1 || rating > 5) return send(res, 400, { error: E(req, 'badRating') });
    if (o.status !== 'done') return send(res, 400, { error: E(req, 'needDone') });
    if (db.prepare('SELECT 1 FROM reviews WHERE order_token = ?').get(o.token)) return send(res, 409, { error: E(req, 'reviewExists') });
    const text = String(body.text || '').trim().slice(0, 500);
    const name = String(o.name || '').trim().split(/\s+/)[0].slice(0, 30); // на сайте показываем только имя
    db.prepare('INSERT INTO reviews (order_token, customer_id, name, location_id, rating, text, created_at) VALUES (?,?,?,?,?,?,?)')
      .run(o.token, o.customer_id ?? null, name, o.location_id, rating, text, Date.now());
    return send(res, 201, { ok: true });
  }
  if (req.method === 'GET' && p === '/api/reviews') {
    const limit = Math.min(Math.max(+url.searchParams.get('limit') || 6, 1), 50);
    const offset = Math.max(+url.searchParams.get('offset') || 0, 0);
    const sum = db.prepare("SELECT COUNT(*) n, COALESCE(AVG(rating), 0) a FROM reviews WHERE status = 'published'").get();
    const stars = [0, 0, 0, 0, 0];
    for (const r of db.prepare("SELECT rating, COUNT(*) n FROM reviews WHERE status = 'published' GROUP BY rating").all()) stars[r.rating - 1] = r.n;
    const itemsOut = db.prepare("SELECT id, name, rating, text, location_id, reply, created_at FROM reviews WHERE status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset)
      .map(r => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, locationId: r.location_id, reply: r.reply, createdAt: r.created_at }));
    return send(res, 200, { count: sum.n, avg: Math.round(sum.a * 10) / 10, stars, items: itemsOut });
  }

  // ---- персонал: личный вход по PIN, смены ----
  if (req.method === 'POST' && p === '/api/staff/login') {
    const key = 'stafflogin' + clientIp(req), now = Date.now();
    const fails = (buckets.get(key) || []).filter(t => now - t < 5 * 60e3);
    if (fails.length >= 8) return send(res, 429, { error: 'Слишком много попыток. Подождите 5 минут.' });
    const body = await readBody(req);
    const pin = String(body.pin || '').trim();
    const row = (pin.length >= 4 && pin.length <= 32) ? db.prepare('SELECT * FROM staff WHERE pin_hash = ? AND active = 1').get(hashPin(pin)) : null;
    if (!row) { fails.push(now); buckets.set(key, fails); return send(res, 401, { error: 'Неверный PIN' }); }
    const locId = String(body.locationId || '');
    if (!(locById.has(locId) || (row.role === 'manager' && locId === 'all'))) return send(res, 400, { error: 'Выберите кофейню' });
    const token = crypto.randomBytes(24).toString('hex');
    const shiftId = tx(db, () => {
      db.prepare('UPDATE shifts SET ended_at = ? WHERE staff_id = ? AND ended_at IS NULL').run(now, row.id);
      const id = db.prepare('INSERT INTO shifts (staff_id, location_id, started_at) VALUES (?,?,?)').run(row.id, locId, now).lastInsertRowid;
      db.prepare('INSERT INTO staff_sessions (token_hash, staff_id, shift_id, expires_at) VALUES (?,?,?,?)').run(sha(token), row.id, id, now + STAFF_SESSION_TTL);
      return id;
    });
    return send(res, 200, { token, staff: { id: row.id, name: row.name, role: row.role }, shift: { id: shiftId, locationId: locId, startedAt: now } });
  }
  if (p.startsWith('/api/staff/')) {
    const me = staffFrom(req);
    if (!me) return send(res, 401, { error: 'Нужен вход' });
    const eff = me.loc === 'all' ? null : me.loc; // бариста видит только кофейню своей смены
    if (req.method === 'GET' && p === '/api/staff/me') {
      const handled = db.prepare('SELECT COUNT(*) n FROM orders WHERE (ready_by = ? OR done_by = ?) AND COALESCE(ready_at, done_at) >= ?').get(me.id, me.id, me.started_at).n;
      return send(res, 200, { id: me.id, name: me.name, role: me.role, locationId: me.loc, startedAt: me.started_at, handled });
    }
    if (req.method === 'POST' && p === '/api/staff/logout') {
      endShift(me.shift_id);
      db.prepare('DELETE FROM staff_sessions WHERE token_hash = ?').run(sha(String(req.headers['x-staff-token'])));
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && p === '/api/staff/orders') {
      const rows = db.prepare(`SELECT o.*, a.name AS accepted_name, r.name AS ready_name FROM orders o
          LEFT JOIN staff a ON a.id = o.accepted_by LEFT JOIN staff r ON r.id = o.ready_by
          WHERE o.status IN ('new','preparing','ready') ORDER BY o.created_at`).all()
        .filter(r => !eff || r.location_id === eff);
      return send(res, 200, rows.map(r => ({ ...rowToOrder(r), location: locById.get(r.location_id)?.address, acceptedBy: r.accepted_name || '', readyBy: r.ready_name || '' })));
    }
    const upd = p.match(/^\/api\/staff\/orders\/([a-f0-9]+)$/);
    if (req.method === 'PATCH' && upd) {
      const { status } = await readBody(req);
      const o = db.prepare('SELECT status, location_id FROM orders WHERE token = ?').get(upd[1]);
      if (!o) return send(res, 404, { error: 'Не найден' });
      if (eff && o.location_id !== eff) return send(res, 403, { error: 'Заказ другой кофейни' });
      if (!STATUSES.includes(status)) return send(res, 400, { error: 'Неверный статус' });
      if (!ACTIVE.includes(o.status)) return send(res, 409, { error: 'Заказ уже закрыт' });
      setStatus(upd[1], status, me.id);
      return send(res, 200, { ok: true });
    }
  }

  // ---- владелец: аналитика ----
  if (p.startsWith('/api/admin/')) {
    const auth = pinAuth(req, ADMIN_PIN, 'admin');
    if (auth === 'blocked') return send(res, 429, { error: 'Слишком много попыток. Подождите 5 минут.' });
    if (auth !== 'ok') return send(res, 401, { error: 'Неверный PIN' });
    // сотрудники
    if (req.method === 'GET' && p === '/api/admin/staff') {
      const since = Date.now() - 30 * 86400e3, live = Date.now() - STAFF_SESSION_TTL;
      const rows = db.prepare(`SELECT s.*,
          (SELECT MAX(sh.started_at) FROM shifts sh WHERE sh.staff_id = s.id) AS last_shift,
          (SELECT sh.location_id FROM shifts sh WHERE sh.staff_id = s.id AND sh.ended_at IS NULL AND sh.started_at > ? ORDER BY sh.started_at DESC LIMIT 1) AS on_shift,
          (SELECT COUNT(*) FROM orders o WHERE o.ready_by = s.id AND o.created_at >= ?) AS handled
          FROM staff s ORDER BY s.active DESC, s.name`).all(live, since);
      return send(res, 200, rows.map(r => ({ id: r.id, name: r.name, role: r.role, active: !!r.active, lastShift: r.last_shift, onShift: r.on_shift, handled30: r.handled })));
    }
    if (req.method === 'POST' && p === '/api/admin/staff') {
      const body = await readBody(req);
      const name = String(body.name || '').trim().slice(0, 40);
      if (!name) return send(res, 400, { error: 'Укажите имя' });
      const role = body.role === 'manager' ? 'manager' : 'barista';
      let pin = String(body.pin || '').trim();
      if (pin) {
        if (!/^\d{4,8}$/.test(pin)) return send(res, 400, { error: 'PIN: от 4 до 8 цифр' });
        if (db.prepare('SELECT 1 FROM staff WHERE pin_hash = ?').get(hashPin(pin))) return send(res, 409, { error: 'Такой PIN уже занят, выберите другой' });
      } else pin = randomPin();
      const id = db.prepare('INSERT INTO staff (name, pin_hash, role, active, created_at) VALUES (?,?,?,?,?)').run(name, hashPin(pin), role, 1, Date.now()).lastInsertRowid;
      return send(res, 201, { id, pin });
    }
    const st = p.match(/^\/api\/admin\/staff\/(\d+)$/);
    if (req.method === 'PATCH' && st) {
      const body = await readBody(req);
      const row = db.prepare('SELECT * FROM staff WHERE id = ?').get(+st[1]);
      if (!row) return send(res, 404, { error: 'Сотрудник не найден' });
      let newPin;
      tx(db, () => {
        if (typeof body.name === 'string' && body.name.trim()) db.prepare('UPDATE staff SET name = ? WHERE id = ?').run(body.name.trim().slice(0, 40), row.id);
        if (body.role === 'barista' || body.role === 'manager') db.prepare('UPDATE staff SET role = ? WHERE id = ?').run(body.role, row.id);
        if (typeof body.active === 'boolean') {
          db.prepare('UPDATE staff SET active = ? WHERE id = ?').run(body.active ? 1 : 0, row.id);
          if (!body.active) { db.prepare('DELETE FROM staff_sessions WHERE staff_id = ?').run(row.id); db.prepare('UPDATE shifts SET ended_at = ? WHERE staff_id = ? AND ended_at IS NULL').run(Date.now(), row.id); }
        }
        if (body.resetPin) {
          newPin = randomPin();
          db.prepare('UPDATE staff SET pin_hash = ? WHERE id = ?').run(hashPin(newPin), row.id);
          db.prepare('DELETE FROM staff_sessions WHERE staff_id = ?').run(row.id);
        }
      });
      return send(res, 200, { ok: true, pin: newPin });
    }
    if (req.method === 'GET' && p === '/api/admin/shifts') {
      const from = Date.now() - Math.min(Math.max(+url.searchParams.get('days') || 7, 1), 90) * 86400e3;
      const rows = db.prepare(`SELECT sh.*, s.name FROM shifts sh JOIN staff s ON s.id = sh.staff_id WHERE sh.started_at >= ? ORDER BY sh.started_at DESC LIMIT 200`).all(from);
      return send(res, 200, rows.map(r => ({
        id: r.id, name: r.name, locationId: r.location_id, startedAt: r.started_at, endedAt: r.ended_at,
        orders: db.prepare('SELECT COUNT(*) n FROM orders WHERE ready_by = ? AND ready_at >= ? AND ready_at <= ?').get(r.staff_id, r.started_at, r.ended_at || Date.now()).n
      })));
    }
    // отзывы: модерация и ответ владельца
    if (req.method === 'GET' && p === '/api/admin/reviews') {
      const rows = db.prepare('SELECT r.*, o.number FROM reviews r JOIN orders o ON o.token = r.order_token ORDER BY r.created_at DESC LIMIT 200').all();
      return send(res, 200, rows.map(r => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, status: r.status, reply: r.reply, locationId: r.location_id, createdAt: r.created_at, orderNumber: r.number })));
    }
    const rvp = p.match(/^\/api\/admin\/reviews\/(\d+)$/);
    if (req.method === 'PATCH' && rvp) {
      const body = await readBody(req);
      if (!db.prepare('SELECT 1 FROM reviews WHERE id = ?').get(+rvp[1])) return send(res, 404, { error: 'Отзыв не найден' });
      if (body.status === 'published' || body.status === 'hidden') db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(body.status, +rvp[1]);
      if (typeof body.reply === 'string') db.prepare('UPDATE reviews SET reply = ? WHERE id = ?').run(body.reply.trim().slice(0, 500), +rvp[1]);
      return send(res, 200, { ok: true });
    }
    const days = Math.min(Math.max(+url.searchParams.get('days') || 7, 1), 365);
    if (req.method === 'GET' && p === '/api/admin/stats') {
      const loc = url.searchParams.get('loc');
      return send(res, 200, stats(days, locById.has(loc) ? loc : null));
    }
    if (req.method === 'GET' && p === '/api/admin/orders.csv') {
      return send(res, 200, ordersCsv(days), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="drinkstar-orders-${days}d.csv"` });
    }
  }
  send(res, 404, { error: 'Не найдено' });
}

// --- статика ---
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUB, rel));
  if (!file.startsWith(PUB + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': rel.startsWith('/img/') ? 'public, max-age=86400' : 'no-cache',
      ...SEC_HEADERS
    });
    res.end(buf);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    send(res, 400, { error: 'Некорректный запрос' });
  }
}).listen(PORT, () => {
  console.log(`DrinkStar: http://localhost:${PORT}`);
  console.log(`Персонал:  http://localhost:${PORT}/staff.html   (личные PIN бариста заводит владелец в аналитике; PIN менеджера из STAFF_PIN: ${STAFF_PIN === DEFAULT_STAFF_PIN ? DEFAULT_STAFF_PIN + ', смените!' : 'задан'})`);
  console.log(`Владелец:  http://localhost:${PORT}/admin.html   (PIN ${ADMIN_PIN === DEFAULT_ADMIN_PIN ? DEFAULT_ADMIN_PIN + ', смените!' : 'задан'})`);
  console.log(`Оплата:    ${provider ? provider.name + (provider.name === 'mock' ? ' (демо)' : '') : 'отключена, только на кассе'}`);
  console.log(`SMS:       ${sms.name}${sms.demo ? ' (демо: код показывается на странице)' : ''}`);
});
