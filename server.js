// DrinkStar: сайт + онлайн-заказ + оплата + клуб + экран персонала + аналитика. Без внешних зависимостей.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { open, tx } = require('./lib/db');
const limits = require('./lib/limits');
const { HttpError, clientIp, isHttps, securityHeaders, sendJson, sendText, sendBuffer, readBody, readRaw, cookies, createStatic, TYPES } = require('./lib/http');
const { analytics } = require('./lib/analytics');

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const DEFAULT_STAFF_PIN = '1234';
const DEFAULT_ADMIN_PIN = '0000';
const STAFF_PIN = process.env.STAFF_PIN || DEFAULT_STAFF_PIN;
const ADMIN_PIN = process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN;
const ALLOW_DEMO = process.env.ALLOW_DEMO === '1';
const FORCE_OPEN = !IS_PROD && process.env.FORCE_OPEN === '1'; // только для тестов и показа вне боевого режима
const PUB = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const DATA_DIR = process.env.DATA_DIR || DATA;
const PAY_TTL = 15 * 60 * 1000;            // неоплаченный онлайн-заказ отменяется через 15 минут
const SESSION_TTL = 90 * 24 * 3600 * 1000; // вход в клуб держится 90 дней
const STAFF_SESSION_TTL = 14 * 3600e3;
const ADMIN_SESSION_TTL = 12 * 3600e3;
const CODE_TTL = 5 * 60 * 1000;
const TZ_OFFSET_H = 5;                     // Астана, UTC+5
const PREP_SLA_MIN = +process.env.PREP_SLA_MIN || 7; // целевое время приготовления
const SMS_HOURLY_CAP = +process.env.SMS_HOURLY_CAP || 300; // потолок SMS в час на всё приложение (защита бюджета)
const STARTED = Date.now();

if (IS_PROD) {
  if (STAFF_PIN === DEFAULT_STAFF_PIN || ADMIN_PIN === DEFAULT_ADMIN_PIN || STAFF_PIN === ADMIN_PIN) {
    console.error('Остановлено: в боевом режиме задайте разные STAFF_PIN и ADMIN_PIN (не 1234 и не 0000).');
    process.exit(1);
  }
}

const readJson = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const baseMenu = readJson('menu.json');
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
  soldOut: ['«{name}» сейчас нет в этой кофейне', '«{name}» бұл кофеханада қазір жоқ', '“{name}” is not available at this coffee shop right now'],
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
const LANGS = ['ru', 'kk', 'en'];
const langOf = req => { const l = String(req.headers['x-lang'] || ''); return LANGS.includes(l) ? l : 'ru'; };
function E(x, key, vars) {
  const i = LANGS.indexOf(typeof x === 'string' ? x : langOf(x));
  let m = ERR[key][i < 0 ? 0 : i];
  for (const k in vars || {}) m = m.split('{' + k + '}').join(vars[k]);
  return m;
}

const locById = new Map(locations.map(l => [l.id, l]));
const catName = new Map(baseMenu.categories.map(c => [c.id, c.name]));

// --- подключаемые провайдеры: payments/<имя>.js и sms/<имя>.js ---
function loadProvider(dir, name, what) {
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(path.join(__dirname, dir, name + '.js'))) {
    console.error(`Нет ${what} "${name}" в папке ${dir}/`); process.exit(1);
  }
  return require('./' + dir + '/' + name);
}
const payName = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
const rawProvider = payName === 'none' ? null : loadProvider('payments', payName, 'платёжного провайдера');
const sms = loadProvider('sms', (process.env.SMS_PROVIDER || 'demo').toLowerCase(), 'SMS-провайдера');
// Демо-провайдеры опасны в бою: демо-SMS отдаёт код прямо в ответе (любой войдёт под чужим номером),
// демо-оплата «оплачивает» заказ без денег. В боевом режиме они включаются только явным ALLOW_DEMO=1.
const demoBlocked = IS_PROD && !ALLOW_DEMO;
const provider = rawProvider && !(rawProvider.name === 'mock' && demoBlocked) ? rawProvider : null;
const smsAllowed = !(sms.demo && demoBlocked);
const DEMO = (!!provider && provider.name === 'mock') || (smsAllowed && !!sms.demo);
if (demoBlocked && (rawProvider?.name === 'mock' || sms.demo)) console.error('ВНИМАНИЕ: демо-оплата и демо-SMS отключены в боевом режиме. Подключите настоящих провайдеров (см. README) или поставьте ALLOW_DEMO=1 только для показа.');

// --- база и подготовленные запросы (каждый запрос готовится один раз) ---
const db = open(DATA_DIR);
const stmts = new Map();
const P = sql => { let s = stmts.get(sql); if (!s) { s = db.prepare(sql); stmts.set(sql, s); } return s; };

// --- сотрудники: личные аккаунты бариста со сменами ---
const metaGet = k => P('SELECT value FROM meta WHERE key = ?').get(k)?.value;
if (!metaGet('pin_secret')) P('INSERT INTO meta (key, value) VALUES (?, ?)').run('pin_secret', crypto.randomBytes(32).toString('hex'));
const PIN_SECRET = metaGet('pin_secret');
const hashPin = pin => crypto.createHmac('sha256', PIN_SECRET).update(String(pin)).digest('hex');
// PIN сотрудника хранится ещё и в зашифрованном виде (AES-256-GCM), чтобы владелец мог напомнить его, если не записали
const PIN_KEY = crypto.createHash('sha256').update(PIN_SECRET + ':enc').digest();
function encPin(pin) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', PIN_KEY, iv);
  const ct = Buffer.concat([c.update(String(pin), 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map(b => b.toString('hex')).join(':');
}
function decPin(str) {
  try {
    const [iv, tag, ct] = String(str).split(':').map(h => Buffer.from(h, 'hex'));
    const c = crypto.createDecipheriv('aes-256-gcm', PIN_KEY, iv); c.setAuthTag(tag);
    return Buffer.concat([c.update(ct), c.final()]).toString('utf8');
  } catch { return null; }
}
// первый запуск: STAFF_PIN становится PIN менеджера; бариста владелец заводит в аналитике
if (P('SELECT COUNT(*) n FROM staff').get().n === 0) {
  P('INSERT INTO staff (name, pin_hash, role, active, created_at, pin_enc) VALUES (?,?,?,?,?,?)').run('Менеджер', hashPin(STAFF_PIN), 'manager', 1, Date.now(), encPin(STAFF_PIN));
}
// PIN менеджера из STAFF_PIN можно восстановить, даже если аккаунт создан до появления шифрования
for (const r of P('SELECT id, pin_hash FROM staff WHERE pin_enc IS NULL').all()) if (r.pin_hash === hashPin(STAFF_PIN)) P('UPDATE staff SET pin_enc = ? WHERE id = ?').run(encPin(STAFF_PIN), r.id);
const STATUSES = ['new', 'preparing', 'ready', 'done', 'cancelled'];
const ACTIVE = ['new', 'preparing', 'ready'];
const VALID = "status NOT IN ('cancelled','awaiting_payment')";

// --- меню: базовый файл + правки владельца (цены, скрытие) + стоп-лист по кофейням ---
// базовое меню из файла + позиции, добавленные владельцем
function fullCategories() {
  const cats = JSON.parse(JSON.stringify(baseMenu.categories));
  for (const r of P('SELECT id, category, data FROM menu_custom ORDER BY created_at').all()) {
    const c = cats.find(x => x.id === r.category);
    if (c) c.items.push({ id: r.id, custom: true, ...JSON.parse(r.data) });
  }
  return cats;
}
function buildMenu() {
  const ov = new Map(P('SELECT item_id, variant, price FROM menu_overrides').all().map(r => [r.item_id + ':' + r.variant, r.price]));
  const hidden = new Set(P('SELECT item_id FROM item_hidden').all().map(r => r.item_id));
  const menu = JSON.parse(JSON.stringify(baseMenu));
  menu.categories = fullCategories();
  const items = new Map();
  for (const c of menu.categories) {
    c.items = c.items.filter(i => !hidden.has(i.id));
    for (const i of c.items) {
      i.variants.forEach((v, idx) => { if (ov.has(i.id + ':' + idx)) v.price = ov.get(i.id + ':' + idx); });
      items.set(i.id, { ...i, category: c.id });
    }
  }
  return { menu, items };
}
let MENU = buildMenu();
function loadStop() {
  const m = new Map();
  for (const r of P('SELECT location_id, item_id FROM stoplist').all()) { if (!m.has(r.location_id)) m.set(r.location_id, new Set()); m.get(r.location_id).add(r.item_id); }
  return m;
}
let STOP = loadStop();
const stopObject = () => Object.fromEntries([...STOP].map(([k, v]) => [k, [...v]]));
const addons = new Map(baseMenu.addons.map(a => [a.id, a]));

// --- утилиты ---
function astanaMinutes() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value;
}
const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
const isOpen = l => { if (FORCE_OPEN) return true; const n = astanaMinutes(); return n >= toMin(l.open) && n < toMin(l.close); };
const dayStart = ts => Math.floor((ts + TZ_OFFSET_H * 3600e3) / 86400e3) * 86400e3 - TZ_OFFSET_H * 3600e3;
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
// вычищаем управляющие символы: имена и комментарии потом попадают в выгрузки, логи и экраны
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max);
const same = (a, b) => crypto.timingSafeEqual(Buffer.from(sha(a)), Buffer.from(sha(b)));
const baseUrl = req => {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const host = String(req.headers.host || '');
  return (isHttps(req) ? 'https://' : 'http://') + (/^[a-z0-9.-]+(:\d+)?$/i.test(host) ? host : 'localhost');
};

// журнал действий: кто и что менял
function audit(actor, action, detail, req) {
  try { P('INSERT INTO audit (at, actor, action, detail, ip) VALUES (?,?,?,?,?)').run(Date.now(), actor, action, String(detail || '').slice(0, 500), req ? clientIp(req) : ''); } catch { /* журнал не должен ломать работу */ }
}

// --- бонусы: единственное место, где меняется баланс ---
function adjustBonus(customerId, delta, reason, orderToken) {
  P('UPDATE customers SET bonus = bonus + ? WHERE id = ?').run(delta, customerId);
  P('INSERT INTO bonus_tx (customer_id, delta, reason, order_token, created_at) VALUES (?,?,?,?,?)').run(customerId, delta, reason, orderToken || null, Date.now());
}

// --- представление заказа ---
const rowToOrder = r => ({
  token: r.token, number: r.number, locationId: r.location_id, status: r.status, createdAt: r.created_at,
  name: r.name, phone: r.phone, comment: r.comment, payment: r.payment, paid: !!r.paid,
  items: JSON.parse(r.items), total: r.total, bonusUsed: r.bonus_used, payable: r.payable,
  cashback: r.cashback, member: !!r.customer_id
});
const reviewOf = token => P('SELECT rating, text, reply FROM reviews WHERE order_token = ?').get(token) || null;
const publicOrder = r => {
  const o = rowToOrder(r);
  const review = reviewOf(r.token);
  return {
    number: o.number, status: o.status, items: o.items, total: o.total, name: o.name, payment: o.payment, paid: o.paid,
    bonusUsed: o.bonusUsed, payable: o.payable, member: o.member,
    cashback: o.member && r.status !== 'cancelled' && !r.cashback_done ? o.cashback : 0,
    cashbackDone: !!r.cashback_done,
    payUrl: r.status === 'awaiting_payment' ? r.pay_url : undefined,
    review, canReview: r.status === 'done' && !review,
    location: locById.get(o.locationId)?.address, locationId: o.locationId, createdAt: o.createdAt
  };
};
// примерное время до готовности: по скорости последних заказов точки и очереди перед этим заказом
function etaMin(r) {
  if (!['new', 'preparing'].includes(r.status)) return null;
  const recent = P('SELECT ready_at - created_at AS d FROM orders WHERE location_id = ? AND ready_at IS NOT NULL AND ready_at > ? ORDER BY ready_at DESC LIMIT 20')
    .all(r.location_id, Date.now() - 3 * 3600e3).map(x => x.d / 60000);
  const avgPrep = recent.length >= 3 ? recent.reduce((a, b) => a + b, 0) / recent.length : 5;
  const ahead = P("SELECT COUNT(*) n FROM orders WHERE location_id = ? AND status IN ('new','preparing') AND created_at < ?").get(r.location_id, r.created_at).n;
  const est = Math.min(30, Math.max(2, avgPrep * (1 + ahead * 0.25)));
  return Math.max(1, Math.round(est - (Date.now() - r.created_at) / 60000));
}
// «хиты»: три самые частые позиции за 30 дней, но только когда данных достаточно
let popCache = { at: 0, ids: [] };
function popular() {
  if (Date.now() - popCache.at < 600e3) return popCache.ids;
  const rows = P(`SELECT items FROM orders WHERE created_at >= ? AND ${VALID}`).all(Date.now() - 30 * 86400e3);
  const qty = {};
  if (rows.length >= 30) for (const r of rows) for (const i of JSON.parse(r.items)) qty[i.id] = (qty[i.id] || 0) + i.qty;
  const ids = Object.entries(qty).filter(([id, n]) => n >= 5 && MENU.items.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  popCache = { at: Date.now(), ids };
  return ids;
}

// --- смена статуса: возвраты и начисления бонусов ---
function setStatus(token, status, staffId) {
  return tx(db, () => {
    const o = P('SELECT * FROM orders WHERE token = ?').get(token);
    if (!o) return false;
    if (status === 'cancelled' && o.status !== 'cancelled' && o.bonus_used > 0 && !o.bonus_refunded) {
      adjustBonus(o.customer_id, o.bonus_used, 'refund', token);
      P('UPDATE orders SET bonus_refunded = 1 WHERE token = ?').run(token);
    }
    if (status === 'done' && o.customer_id && o.cashback > 0 && !o.cashback_done) {
      adjustBonus(o.customer_id, o.cashback, 'cashback', token);
      P('UPDATE orders SET cashback_done = 1 WHERE token = ?').run(token);
    }
    P('UPDATE orders SET status = ? WHERE token = ?').run(status, token);
    if (staffId) {
      const now = Date.now();
      if (status === 'preparing') P('UPDATE orders SET accepted_by = COALESCE(accepted_by, ?), accepted_at = COALESCE(accepted_at, ?) WHERE token = ?').run(staffId, now, token);
      if (status === 'ready') P('UPDATE orders SET ready_by = ?, ready_at = ? WHERE token = ?').run(staffId, now, token);
      if (status === 'done') P('UPDATE orders SET done_by = ?, done_at = ? WHERE token = ?').run(staffId, now, token);
    }
    return true;
  });
}
// оплата подтверждена провайдером или демо-страницей: заказ уходит бариста
function markPaid(token) {
  tx(db, () => {
    const o = P('SELECT * FROM orders WHERE token = ?').get(token);
    if (!o || o.paid) return;
    if (o.status === 'awaiting_payment') P("UPDATE orders SET status = 'new' WHERE token = ?").run(token);
    else if (o.status === 'cancelled' && o.expired) {
      // деньги пришли уже после отмены: оживляем заказ и снова списываем бонусы (баланс может уйти в минус, это честный учёт)
      P("UPDATE orders SET status = 'new', expired = 0 WHERE token = ?").run(token);
      if (o.bonus_refunded && o.bonus_used > 0) {
        adjustBonus(o.customer_id, -o.bonus_used, 'order', token);
        P('UPDATE orders SET bonus_refunded = 0 WHERE token = ?').run(token);
      }
    }
    P('UPDATE orders SET paid = 1, paid_at = ? WHERE token = ?').run(Date.now(), token);
  });
}

// --- обслуживание: раз в 30 секунд, а не на каждый запрос ---
function maintenance() {
  try {
    const now = Date.now();
    for (const { token } of P("SELECT token FROM orders WHERE status = 'awaiting_payment' AND created_at < ?").all(now - PAY_TTL)) {
      setStatus(token, 'cancelled');
      P('UPDATE orders SET expired = 1 WHERE token = ?').run(token);
    }
    P('UPDATE shifts SET ended_at = started_at + ? WHERE ended_at IS NULL AND started_at < ?').run(STAFF_SESSION_TTL, now - STAFF_SESSION_TTL);
    P('DELETE FROM staff_sessions WHERE expires_at < ?').run(now);
    P('DELETE FROM sessions WHERE expires_at < ?').run(now);
    P('DELETE FROM admin_sessions WHERE expires_at < ?').run(now);
    P('DELETE FROM sms_codes WHERE expires_at < ?').run(now - 3600e3);
    P('DELETE FROM audit WHERE at < ?').run(now - 365 * 86400e3);
    limits.sweep();
  } catch (e) { console.error('maintenance:', e.message); }
}

// --- резервные копии базы: раз в сутки, хранятся 7 штук ---
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
function backupFile(file) { // VACUUM INTO даёт целостную копию даже при работающей базе
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  return file;
}
function dailyBackup() {
  try {
    const name = 'drinkstar-' + new Date(Date.now() + TZ_OFFSET_H * 3600e3).toISOString().slice(0, 10) + '.db';
    const file = path.join(BACKUP_DIR, name);
    if (!fs.existsSync(file)) backupFile(file);
    const all = fs.readdirSync(BACKUP_DIR).filter(f => /^drinkstar-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
    for (const f of all.slice(0, Math.max(0, all.length - 7))) fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
  } catch (e) { console.error('backup:', e.message); }
}
const lastBackup = () => { try { const f = fs.readdirSync(BACKUP_DIR).filter(x => x.endsWith('.db')).sort().pop(); return f ? fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs : null; } catch { return null; } };

// --- вход в клуб ---
function normPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) d = '7' + d;
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  return /^7\d{10}$/.test(d) ? d : null;
}
const SESSION_COOKIE = req => (isHttps(req) ? '__Host-ds_session' : 'ds_session');
function currentCustomer(req) {
  const c = cookies(req);
  const t = c['__Host-ds_session'] || c.ds_session;
  if (!t) return null;
  return P('SELECT c.* FROM sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = ? AND s.expires_at > ?').get(sha(t), Date.now()) || null;
}
const sessionCookie = (req, value, maxAgeSec) =>
  `${SESSION_COOKIE(req)}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${isHttps(req) ? '; Secure' : ''}`;

const addonPrice = (a, member) => (member && club.freeSyrup && a.id === club.syrupAddonId ? 0 : a.price);
const itemLabel = (item, lang) => item['name_' + lang] || item.name;

// --- заказ: цены и бонусы считает сервер, клиенту не верим ---
function priceOrder(body, customer, lang) {
  const member = !!customer;
  const name = clean(body.name || customer?.name, 60);
  const phone = member ? customer.phone : String(body.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  const comment = clean(body.comment, 300);
  const loc = locById.get(body.locationId);
  if (!name) return { error: E(lang, 'needName') };
  if (phone.replace(/\D/g, '').length < 10) return { error: E(lang, 'needPhone') };
  if (!loc) return { error: E(lang, 'needLoc') };
  if (!isOpen(loc)) return { error: E(lang, 'closed', { o: loc.open, c: loc.close }) };
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30) return { error: E(lang, 'emptyCart') };

  let total = 0;
  const lines = [];
  for (const l of body.items) {
    const item = MENU.items.get(l && l.id);
    const variant = item?.variants[(l && l.v) | 0];
    const qty = (l && l.qty) | 0;
    if (!item || !variant || typeof variant.price !== 'number' || qty < 1 || qty > 20) return { error: E(lang, 'badItem') };
    if (STOP.get(loc.id)?.has(item.id)) return { error: E(lang, 'soldOut', { name: itemLabel(item, lang) }) };
    const ads = [...new Set(Array.isArray(l.addons) ? l.addons.slice(0, 10) : [])].map(id => addons.get(id));
    if (ads.some(a => !a)) return { error: E(lang, 'badAddon') };
    const unit = variant.price + ads.reduce((s, a) => s + addonPrice(a, member), 0);
    total += unit * qty;
    lines.push({ id: item.id, v: (l.v | 0), name: item.name, variant: variant.label, qty, addons: ads.map(a => a.name), addonIds: ads.map(a => a.id), unit });
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

// --- выгрузка заказов в Excel ---
// ячейки, начинающиеся с = + - @, Excel выполнил бы как формулу: экранируем
const csvCell = v => {
  let s = String(v ?? '');
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
function ordersCsv(days) {
  const from = dayStart(Date.now()) - (days - 1) * 86400e3;
  const rows = P('SELECT o.*, a.name AS accepted_name, r.name AS ready_name FROM orders o LEFT JOIN staff a ON a.id = o.accepted_by LEFT JOIN staff r ON r.id = o.ready_by WHERE o.created_at >= ? ORDER BY o.created_at').all(from);
  const head = ['Номер', 'Дата (Астана)', 'Кофейня', 'Статус', 'Оплата', 'Клуб', 'Имя', 'Телефон', 'Сумма', 'Бонусами', 'Деньгами', 'Кэшбэк', 'Принял', 'Приготовил', 'Минут до готовности', 'Состав'];
  const lines = rows.map(r => [r.number, new Date(r.created_at + TZ_OFFSET_H * 3600e3).toISOString().replace('T', ' ').slice(0, 16),
    locById.get(r.location_id)?.address, r.status, r.payment, r.customer_id ? 'да' : 'нет', r.name, r.phone.replace(/\D/g, ''),
    r.total, r.bonus_used, r.payable, r.cashback_done ? r.cashback : 0, r.accepted_name || '', r.ready_name || '',
    r.ready_at ? Math.round((r.ready_at - r.created_at) / 6000) / 10 : '',
    JSON.parse(r.items).map(i => `${i.qty}x ${i.name} ${i.variant}${i.addons.length ? ' (' + i.addons.join(', ') + ')' : ''}`).join('; ')]);
  return '﻿' + [head, ...lines].map(l => l.map(csvCell).join(';')).join('\r\n');
}

// --- личные аккаунты персонала ---
function staffFrom(req) {
  const t = String(req.headers['x-staff-token'] || '');
  if (!t) return null;
  return P(`SELECT s.id, s.name, s.role, ss.shift_id, sh.location_id AS loc, sh.started_at
      FROM staff_sessions ss JOIN staff s ON s.id = ss.staff_id LEFT JOIN shifts sh ON sh.id = ss.shift_id
      WHERE ss.token_hash = ? AND ss.expires_at > ? AND s.active = 1`).get(sha(t), Date.now()) || null;
}
function adminFrom(req) {
  const t = String(req.headers['x-admin-token'] || '');
  return !!t && !!P('SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > ?').get(sha(t), Date.now());
}
function randomPin() {
  for (let i = 0; i < 100; i++) {
    const pin = String(crypto.randomInt(100000, 1000000));
    if (!P('SELECT 1 FROM staff WHERE pin_hash = ?').get(hashPin(pin))) return pin;
  }
  throw new Error('нет свободных PIN');
}
function endShift(id) { if (id) P('UPDATE shifts SET ended_at = ? WHERE id = ? AND ended_at IS NULL').run(Date.now(), id); }

// --- поисковая разметка (JSON-LD): кофейни, часы, оценка ---
let ldCache = { at: 0, base: '', json: '' };
function jsonLd(base) {
  if (Date.now() - ldCache.at < 300e3 && ldCache.base === base) return ldCache.json;
  const rv = P("SELECT COUNT(*) n, AVG(rating) a FROM reviews WHERE status = 'published'").get();
  const org = {
    '@context': 'https://schema.org', '@type': 'CafeOrCoffeeShop', name: 'DrinkStar Coffee&more', url: base + '/', image: base + '/img/fall-apple.jpg',
    servesCuisine: 'Coffee', priceRange: '₸₸', inLanguage: ['ru', 'kk', 'en'], slogan: 'Pause the world', hasMenu: base + '/#menu',
    potentialAction: { '@type': 'OrderAction', target: { '@type': 'EntryPoint', urlTemplate: base + '/#menu', actionPlatform: 'http://schema.org/DesktopWebPlatform' }, deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp' },
    department: locations.map(l => ({
      '@type': 'CafeOrCoffeeShop', name: 'DrinkStar ' + l.address, image: base + '/img/vibe-1.jpg',
      address: { '@type': 'PostalAddress', streetAddress: l.address + (l.sub ? ', ' + l.sub : ''), addressLocality: 'Астана', addressCountry: 'KZ' },
      openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: l.open, closes: l.close }]
    }))
  };
  if (company.phone) org.telephone = company.phone;
  if (rv.n >= 3) org.aggregateRating = { '@type': 'AggregateRating', ratingValue: Math.round(rv.a * 10) / 10, reviewCount: rv.n, bestRating: 5, worstRating: 1 };
  const json = JSON.stringify(org).replace(/</g, '\\u003c');
  ldCache = { at: Date.now(), base, json };
  return json;
}

// --- API ---
async function api(req, res, url) {
  const p = url.pathname;
  const send = (code, body, headers) => sendJson(req, res, code, body, headers);

  // защита от запросов с чужих сайтов: изменения принимаем только со своего адреса
  if (req.method !== 'GET' && req.method !== 'HEAD' && p !== '/api/payments/webhook') {
    const origin = req.headers.origin;
    if (origin) {
      let ok = false;
      try { ok = new URL(origin).host === req.headers.host; } catch { /* ok остаётся false */ }
      if (!ok) return send(403, { error: E(req, 'forbidden') });
    }
  }

  if (req.method === 'GET' && p === '/api/menu') return send(200, { ...MENU.menu, popular: popular(), stop: stopObject() });
  if (req.method === 'GET' && p === '/api/stoplist') return send(200, stopObject());
  if (req.method === 'GET' && p === '/api/locations') return send(200, locations);
  if (req.method === 'GET' && p === '/api/config') {
    return send(200, {
      onlinePayment: !!provider, paymentLabel: provider?.label || '', demoPayment: provider?.name === 'mock', demo: DEMO,
      club: { name: club.name, cashbackPercent: club.cashbackPercent, maxBonusPercent: club.maxBonusPercent, freeSyrup: club.freeSyrup, syrupAddonId: club.syrupAddonId },
      demoSms: smsAllowed && !!sms.demo,
      company: { name: company.name, bin: company.bin, address: company.address, phone: company.phone, email: company.email, storage: company.storage, legalVersion: company.legalVersion, draft: !!company.draft }
    });
  }

  // ---- клуб: вход по телефону и коду ----
  if (req.method === 'POST' && p === '/api/auth/request') {
    const reqBody = await readBody(req);
    const phone = normPhone(reqBody.phone);
    if (!phone) return send(400, { error: E(req, 'phoneFull') });
    if (reqBody.consent !== true) return send(400, { error: E(req, 'needConsent') });
    if (!smsAllowed) return send(502, { error: E(req, 'smsFail') });
    // лимиты: по IP мягкий (в кофейне все гости на одном Wi-Fi), по номеру жёсткий, общий потолок защищает бюджет на SMS
    if (limits.hit('sms-ip:' + clientIp(req), 3600e3, 30) || limits.hit('sms-phone:' + phone, 3600e3, 5) || limits.hit('sms-all', 3600e3, SMS_HOURLY_CAP)) return send(429, { error: E(req, 'tooManyReq') });
    const prev = P('SELECT sent_at FROM sms_codes WHERE phone = ?').get(phone);
    if (prev && Date.now() - prev.sent_at < 60e3) return send(429, { error: E(req, 'codeSent') });
    const code = String(crypto.randomInt(100000, 1000000));
    try { await sms.send(phone, code); }
    catch (e) { console.error('SMS не отправлено:', e.message); return send(502, { error: E(req, 'smsFail') }); }
    P('INSERT OR REPLACE INTO sms_codes (phone, code_hash, expires_at, attempts, sent_at) VALUES (?,?,?,?,?)')
      .run(phone, sha(phone + ':' + code), Date.now() + CODE_TTL, 0, Date.now());
    return send(200, { ok: true, demoCode: sms.demo ? code : undefined });
  }
  if (req.method === 'POST' && p === '/api/auth/verify') {
    const body = await readBody(req);
    if (body.consent !== true) return send(400, { error: E(req, 'needConsent') });
    const phone = normPhone(body.phone);
    // неверные коды по номеру считаются суммарно за час, новый запрос кода счётчик не обнуляет
    if (phone && limits.count('vfail:' + phone, 3600e3) >= 10) return send(429, { error: E(req, 'tooManyAttempts') });
    const row = phone && P('SELECT * FROM sms_codes WHERE phone = ?').get(phone);
    if (!row || row.expires_at < Date.now()) return send(400, { error: E(req, 'codeExpired') });
    if (row.attempts >= 5) return send(429, { error: E(req, 'tooManyAttempts') });
    P('UPDATE sms_codes SET attempts = attempts + 1 WHERE phone = ?').run(phone);
    const given = Buffer.from(sha(phone + ':' + String(body.code || '').trim())), want = Buffer.from(row.code_hash);
    if (!crypto.timingSafeEqual(given, want)) { limits.fail('vfail:' + phone, 3600e3); return send(400, { error: E(req, 'wrongCode') }); }
    P('DELETE FROM sms_codes WHERE phone = ?').run(phone);
    limits.reset('vfail:' + phone);
    let c = P('SELECT * FROM customers WHERE phone = ?').get(phone);
    const name = clean(body.name, 60);
    if (!c) {
      const id = P('INSERT INTO customers (phone, name, created_at) VALUES (?,?,?)').run(phone, name, Date.now()).lastInsertRowid;
      c = P('SELECT * FROM customers WHERE id = ?').get(id);
    } else if (!c.name && name) { P('UPDATE customers SET name = ? WHERE id = ?').run(name, c.id); c.name = name; }
    P('UPDATE customers SET consent_at = ?, consent_version = ?, marketing = ? WHERE id = ?').run(Date.now(), company.legalVersion, body.marketing === true ? 1 : 0, c.id);
    const token = crypto.randomBytes(32).toString('hex');
    P('INSERT INTO sessions (token_hash, customer_id, expires_at) VALUES (?,?,?)').run(sha(token), c.id, Date.now() + SESSION_TTL);
    return send(200, { ok: true, customer: { name: c.name, phone: c.phone, bonus: c.bonus } }, { 'Set-Cookie': sessionCookie(req, token, SESSION_TTL / 1000) });
  }
  if (req.method === 'POST' && p === '/api/auth/logout') {
    const c = cookies(req);
    const t = c['__Host-ds_session'] || c.ds_session;
    if (t) P('DELETE FROM sessions WHERE token_hash = ?').run(sha(t));
    return send(200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  }
  if (p === '/api/me') {
    const c = currentCustomer(req);
    if (!c) return send(200, { customer: null });
    if (req.method === 'PATCH') {
      const name = clean((await readBody(req)).name, 60);
      if (name) { P('UPDATE customers SET name = ? WHERE id = ?').run(name, c.id); c.name = name; }
    }
    const orders = P('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10').all(c.id)
      .map(r => ({ token: r.token, ...publicOrder(r) }));
    const history = P('SELECT delta, reason, created_at FROM bonus_tx WHERE customer_id = ? ORDER BY id DESC LIMIT 20').all(c.id);
    return send(200, { customer: { name: c.name, phone: c.phone, bonus: c.bonus }, orders, history });
  }

  // ---- удаление аккаунта и персональных данных ----
  if (req.method === 'POST' && p === '/api/me/delete') {
    const c = currentCustomer(req);
    if (!c) return send(401, { error: E(req, 'notLoggedIn') });
    tx(db, () => {
      // заказы остаются для учёта, но без персональных данных
      P("UPDATE orders SET name = '', phone = '', comment = '', customer_id = NULL WHERE customer_id = ?").run(c.id);
      P("UPDATE reviews SET name = '', customer_id = NULL WHERE customer_id = ?").run(c.id);
      P('DELETE FROM bonus_tx WHERE customer_id = ?').run(c.id);
      P('DELETE FROM sessions WHERE customer_id = ?').run(c.id);
      P('DELETE FROM sms_codes WHERE phone = ?').run(c.phone);
      P('DELETE FROM customers WHERE id = ?').run(c.id);
    });
    audit('customer', 'account.delete', 'id ' + c.id, req);
    return send(200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  }

  // ---- заказы ----
  if (req.method === 'POST' && p === '/api/orders') {
    // лимит по IP широкий: в кофейне гости делятся одним Wi-Fi. Главная защита: лимиты по номеру ниже
    if (limits.hit('order-ip:' + clientIp(req), 600e3, 40)) return send(429, { error: E(req, 'tooManyOrders') });
    const customer = currentCustomer(req);
    const orderBody = await readBody(req);
    if (orderBody.consent !== true) return send(400, { error: E(req, 'needConsent') });
    const { order, error } = priceOrder(orderBody, customer, langOf(req));
    if (error) return send(400, { error });
    if (limits.hit('order-phone:' + order.phone, 3600e3, 8)
      || P("SELECT COUNT(*) n FROM orders WHERE phone = ? AND status IN ('new','preparing','awaiting_payment')").get(order.phone).n >= 4) {
      return send(429, { error: E(req, 'tooManyOrders') });
    }
    const token = crypto.randomBytes(9).toString('hex');
    const now = Date.now();
    try {
      tx(db, () => {
        const number = P('SELECT COUNT(*) n FROM orders WHERE location_id = ? AND created_at >= ?').get(order.locationId, dayStart(now)).n + 1;
        if (order.bonusUsed > 0) {
          const bal = P('SELECT bonus FROM customers WHERE id = ?').get(customer.id).bonus;
          if (bal < order.bonusUsed) throw new Error(E(req, 'noBonus'));
          adjustBonus(customer.id, -order.bonusUsed, 'order', token);
        }
        const status = order.payment === 'online' ? 'awaiting_payment' : 'new';
        P(`INSERT INTO orders (token, number, location_id, status, created_at, name, phone, comment, payment, paid, items, total, bonus_used, payable, cashback, customer_id, consent_version)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(token, number, order.locationId, status, now, order.name, order.phone, order.comment, order.payment,
            order.payment === 'bonus' ? 1 : 0, JSON.stringify(order.items), order.total, order.bonusUsed, order.payable, order.cashback, customer?.id ?? null, company.legalVersion);
      });
    } catch (e) { return send(400, { error: e.message }); }
    if (customer && !customer.name && order.name) P('UPDATE customers SET name = ? WHERE id = ?').run(order.name, customer.id);

    let payUrl;
    if (order.payment === 'online') {
      try {
        // провайдеру уходит сумма к оплате деньгами (уже за вычетом бонусов)
        const pay = await provider.createPayment({ token, number: 0, total: order.payable, grossTotal: order.total, name: order.name, phone: order.phone, items: order.items }, { baseUrl: baseUrl(req) });
        // ссылка на оплату обязана быть https:// (или путь на нашем сайте): иначе клиента можно увести куда угодно
        if (!/^(https:\/\/|\/[^/])/.test(String(pay.url || ''))) throw new Error('недопустимая ссылка оплаты');
        payUrl = pay.url;
        P('UPDATE orders SET pay_url = ?, external_id = ? WHERE token = ?').run(pay.url, pay.externalId || null, token);
      } catch (e) {
        console.error('Ошибка создания платежа:', e.message);
        setStatus(token, 'cancelled');
        return send(502, { error: E(req, 'payFail') });
      }
    }
    const number = P('SELECT number FROM orders WHERE token = ?').get(token).number;
    return send(201, { token, number, payUrl });
  }

  const track = p.match(/^\/api\/orders\/([a-f0-9]{8,40})$/);
  if (req.method === 'GET' && track) {
    const r = P('SELECT * FROM orders WHERE token = ?').get(track[1]);
    return r ? send(200, { ...publicOrder(r), etaMin: etaMin(r) }) : send(404, { error: E(req, 'noOrder') });
  }

  // ---- отзывы ----
  const rv = p.match(/^\/api\/orders\/([a-f0-9]{8,40})\/review$/);
  if (req.method === 'POST' && rv) {
    if (limits.hit('review:' + clientIp(req), 3600e3, 20)) return send(429, { error: E(req, 'tooManyReviews') });
    const o = P('SELECT * FROM orders WHERE token = ?').get(rv[1]);
    if (!o) return send(404, { error: E(req, 'noOrder') });
    const body = await readBody(req);
    const rating = body.rating | 0;
    if (rating < 1 || rating > 5) return send(400, { error: E(req, 'badRating') });
    if (o.status !== 'done') return send(400, { error: E(req, 'needDone') });
    if (P('SELECT 1 FROM reviews WHERE order_token = ?').get(o.token)) return send(409, { error: E(req, 'reviewExists') });
    const text = clean(body.text, 500);
    const name = clean(o.name, 30).split(' ')[0]; // на сайте показываем только имя
    P('INSERT INTO reviews (order_token, customer_id, name, location_id, rating, text, created_at) VALUES (?,?,?,?,?,?,?)')
      .run(o.token, o.customer_id ?? null, name, o.location_id, rating, text, Date.now());
    return send(201, { ok: true });
  }
  if (req.method === 'GET' && p === '/api/reviews') {
    const limit = Math.min(Math.max(+url.searchParams.get('limit') || 6, 1), 50);
    const offset = Math.max(+url.searchParams.get('offset') || 0, 0);
    const sum = P("SELECT COUNT(*) n, COALESCE(AVG(rating), 0) a FROM reviews WHERE status = 'published'").get();
    const stars = [0, 0, 0, 0, 0];
    for (const r of P("SELECT rating, COUNT(*) n FROM reviews WHERE status = 'published' GROUP BY rating").all()) stars[r.rating - 1] = r.n;
    const itemsOut = P("SELECT id, name, rating, text, location_id, reply, created_at FROM reviews WHERE status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset)
      .map(r => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, locationId: r.location_id, reply: r.reply, createdAt: r.created_at }));
    return send(200, { count: sum.n, avg: Math.round(sum.a * 10) / 10, stars, items: itemsOut });
  }

  // уведомление от настоящего провайдера об оплате
  if (req.method === 'POST' && p === '/api/payments/webhook') {
    if (!provider || provider.name === 'mock') return send(404, { error: 'Не найдено' });
    try {
      const { token, paid } = await provider.handleWebhook(req, await readRaw(req));
      if (paid) markPaid(token);
      return send(200, { ok: true });
    } catch (e) {
      console.error('Webhook отклонён:', e.message);
      return send(400, { error: 'invalid' });
    }
  }
  // демо-оплата (только PAYMENT_PROVIDER=mock и только если демо разрешено)
  const mock = p.match(/^\/api\/mock-pay\/([a-f0-9]{8,40})$/);
  if (req.method === 'POST' && mock) {
    if (provider?.name !== 'mock') return send(404, { error: 'Не найдено' });
    const r = P("SELECT token FROM orders WHERE token = ? AND payment = 'online'").get(mock[1]);
    if (!r) return send(404, { error: E(req, 'noOrder') });
    markPaid(r.token);
    return send(200, { ok: true });
  }

  // ---- персонал: личный вход по PIN, смены ----
  if (req.method === 'POST' && p === '/api/staff/login') {
    const ipKey = 'stafflogin:' + clientIp(req);
    // два замка: по адресу и общий (его не обойти сменой адреса); окно 15 минут
    if (limits.count(ipKey, 300e3) >= 8 || limits.count('stafflogin:*', 900e3) >= 60) return send(429, { error: 'Слишком много попыток. Подождите 5 минут.' });
    const body = await readBody(req);
    const pin = String(body.pin || '').trim();
    const row = (pin.length >= 4 && pin.length <= 32) ? P('SELECT * FROM staff WHERE pin_hash = ? AND active = 1').get(hashPin(pin)) : null;
    if (!row) { limits.fail(ipKey, 300e3); limits.fail('stafflogin:*', 900e3); audit('staff?', 'staff.login.fail', '', req); return send(401, { error: 'Неверный PIN' }); }
    const locId = (row.role === 'barista' && row.location_id && locById.has(row.location_id)) ? row.location_id : String(body.locationId || '');
    if (!(locById.has(locId) || (row.role === 'manager' && locId === 'all'))) return send(400, { error: 'Выберите кофейню' });
    const token = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const shiftId = tx(db, () => {
      P('UPDATE shifts SET ended_at = ? WHERE staff_id = ? AND ended_at IS NULL').run(now, row.id);
      const id = P('INSERT INTO shifts (staff_id, location_id, started_at) VALUES (?,?,?)').run(row.id, locId, now).lastInsertRowid;
      P('INSERT INTO staff_sessions (token_hash, staff_id, shift_id, expires_at) VALUES (?,?,?,?)').run(sha(token), row.id, id, now + STAFF_SESSION_TTL);
      return id;
    });
    return send(200, { token, staff: { id: row.id, name: row.name, role: row.role }, shift: { id: shiftId, locationId: locId, startedAt: now } });
  }
  if (p.startsWith('/api/staff/')) {
    const me = staffFrom(req);
    if (!me) return send(401, { error: 'Нужен вход' });
    const eff = me.loc === 'all' ? null : me.loc; // бариста видит только кофейню своей смены
    if (req.method === 'GET' && p === '/api/staff/me') {
      const handled = P('SELECT COUNT(*) n FROM orders WHERE (ready_by = ? OR done_by = ?) AND COALESCE(ready_at, done_at) >= ?').get(me.id, me.id, me.started_at).n;
      return send(200, { id: me.id, name: me.name, role: me.role, locationId: me.loc, startedAt: me.started_at, handled });
    }
    if (req.method === 'POST' && p === '/api/staff/logout') {
      endShift(me.shift_id);
      P('DELETE FROM staff_sessions WHERE token_hash = ?').run(sha(String(req.headers['x-staff-token'])));
      return send(200, { ok: true });
    }
    if (req.method === 'GET' && p === '/api/staff/orders') {
      const rows = P(`SELECT o.*, a.name AS accepted_name, r.name AS ready_name FROM orders o
          LEFT JOIN staff a ON a.id = o.accepted_by LEFT JOIN staff r ON r.id = o.ready_by
          WHERE o.status IN ('new','preparing','ready') ORDER BY o.created_at`).all()
        .filter(r => !eff || r.location_id === eff);
      return send(200, rows.map(r => ({ ...rowToOrder(r), location: locById.get(r.location_id)?.address, acceptedBy: r.accepted_name || '', readyBy: r.ready_name || '' })));
    }
    const upd = p.match(/^\/api\/staff\/orders\/([a-f0-9]{8,40})$/);
    if (req.method === 'PATCH' && upd) {
      const { status } = await readBody(req);
      const o = P('SELECT status, location_id FROM orders WHERE token = ?').get(upd[1]);
      if (!o) return send(404, { error: 'Не найден' });
      if (eff && o.location_id !== eff) return send(403, { error: 'Заказ другой кофейни' });
      if (!STATUSES.includes(status)) return send(400, { error: 'Неверный статус' });
      if (!ACTIVE.includes(o.status)) return send(409, { error: 'Заказ уже закрыт' });
      setStatus(upd[1], status, me.id);
      return send(200, { ok: true });
    }
    // стоп-лист: бариста отмечает, чего нет в наличии в его кофейне
    if (req.method === 'GET' && p === '/api/staff/stoplist') return send(200, { locationId: eff, stop: stopObject() });
    if (req.method === 'POST' && p === '/api/staff/stoplist') {
      const body = await readBody(req);
      const loc = eff || String(body.locationId || '');
      if (!locById.has(loc)) return send(400, { error: 'Выберите кофейню' });
      if (!fullCategories().some(c => c.items.some(i => i.id === body.itemId))) return send(404, { error: 'Позиция не найдена' });
      if (body.stopped) P('INSERT OR IGNORE INTO stoplist (location_id, item_id, since) VALUES (?,?,?)').run(loc, body.itemId, Date.now());
      else P('DELETE FROM stoplist WHERE location_id = ? AND item_id = ?').run(loc, body.itemId);
      STOP = loadStop();
      audit(me.name, body.stopped ? 'stoplist.add' : 'stoplist.remove', loc + ' / ' + body.itemId, req);
      return send(200, { ok: true });
    }
  }

  // ---- владелец: вход по PIN, дальше работает токен (PIN в браузере не хранится) ----
  if (req.method === 'POST' && p === '/api/admin/login') {
    const ipKey = 'adminlogin:' + clientIp(req);
    if (limits.count(ipKey, 300e3) >= 8 || limits.count('adminlogin:*', 900e3) >= 30) return send(429, { error: 'Слишком много попыток. Подождите 5 минут.' });
    const body = await readBody(req);
    if (!same(String(body.pin || ''), ADMIN_PIN)) { limits.fail(ipKey, 300e3); limits.fail('adminlogin:*', 900e3); audit('admin?', 'admin.login.fail', '', req); return send(401, { error: 'Неверный PIN' }); }
    limits.reset(ipKey);
    const token = crypto.randomBytes(32).toString('hex');
    P('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?,?)').run(sha(token), Date.now() + ADMIN_SESSION_TTL);
    audit('admin', 'admin.login', '', req);
    return send(200, { token });
  }
  if (req.method === 'POST' && p === '/api/admin/logout') {
    P('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha(String(req.headers['x-admin-token'] || '')));
    return send(200, { ok: true });
  }
  if (p.startsWith('/api/admin/')) {
    if (!adminFrom(req)) return send(401, { error: 'Нужен вход' });
    // сотрудники
    if (req.method === 'GET' && p === '/api/admin/staff') {
      const since = Date.now() - 30 * 86400e3, live = Date.now() - STAFF_SESSION_TTL;
      const rows = P(`SELECT s.*,
          (SELECT MAX(sh.started_at) FROM shifts sh WHERE sh.staff_id = s.id) AS last_shift,
          (SELECT sh.location_id FROM shifts sh WHERE sh.staff_id = s.id AND sh.ended_at IS NULL AND sh.started_at > ? ORDER BY sh.started_at DESC LIMIT 1) AS on_shift,
          (SELECT COUNT(*) FROM orders o WHERE o.ready_by = s.id AND o.created_at >= ?) AS handled
          FROM staff s ORDER BY s.active DESC, s.name`).all(live, since);
      return send(200, rows.map(r => ({ id: r.id, name: r.name, role: r.role, locationId: r.location_id || '', active: !!r.active, lastShift: r.last_shift, onShift: r.on_shift, handled30: r.handled })));
    }
    if (req.method === 'POST' && p === '/api/admin/staff') {
      const body = await readBody(req);
      const name = clean(body.name, 40);
      if (!name) return send(400, { error: 'Укажите имя' });
      const role = body.role === 'manager' ? 'manager' : 'barista';
      const home = locById.has(body.locationId) ? body.locationId : null;
      let pin = String(body.pin || '').trim();
      if (pin) {
        if (!/^\d{6,8}$/.test(pin)) return send(400, { error: 'PIN: от 6 до 8 цифр' });
        if (P('SELECT 1 FROM staff WHERE pin_hash = ?').get(hashPin(pin))) return send(409, { error: 'Такой PIN уже занят, выберите другой' });
      } else pin = randomPin();
      const id = P('INSERT INTO staff (name, pin_hash, role, active, created_at, location_id, pin_enc) VALUES (?,?,?,?,?,?,?)').run(name, hashPin(pin), role, 1, Date.now(), home, encPin(pin)).lastInsertRowid;
      audit('admin', 'staff.create', `${name} (${role})`, req);
      return send(201, { id, pin });
    }
    const sp = p.match(/^\/api\/admin\/staff\/(\d+)\/pin$/);
    if (req.method === 'GET' && sp) {
      const row = P('SELECT name, pin_enc FROM staff WHERE id = ?').get(+sp[1]);
      if (!row) return send(404, { error: 'Сотрудник не найден' });
      audit('admin', 'staff.pin.view', row.name, req);
      return send(200, { pin: row.pin_enc ? decPin(row.pin_enc) : null });
    }
    const st = p.match(/^\/api\/admin\/staff\/(\d+)$/);
    if (req.method === 'PATCH' && st) {
      const body = await readBody(req);
      const row = P('SELECT * FROM staff WHERE id = ?').get(+st[1]);
      if (!row) return send(404, { error: 'Сотрудник не найден' });
      let newPin;
      tx(db, () => {
        if (typeof body.name === 'string' && clean(body.name, 40)) P('UPDATE staff SET name = ? WHERE id = ?').run(clean(body.name, 40), row.id);
        if (typeof body.locationId === 'string') {
          const home = locById.has(body.locationId) ? body.locationId : null;
          P('UPDATE staff SET location_id = ? WHERE id = ?').run(home, row.id);
          // действующая смена уходит, чтобы бариста вошёл уже на новой точке
          P('DELETE FROM staff_sessions WHERE staff_id = ?').run(row.id);
          P('UPDATE shifts SET ended_at = ? WHERE staff_id = ? AND ended_at IS NULL').run(Date.now(), row.id);
        }
        if (body.role === 'barista' || body.role === 'manager') P('UPDATE staff SET role = ? WHERE id = ?').run(body.role, row.id);
        if (typeof body.active === 'boolean') {
          P('UPDATE staff SET active = ? WHERE id = ?').run(body.active ? 1 : 0, row.id);
          if (!body.active) { P('DELETE FROM staff_sessions WHERE staff_id = ?').run(row.id); P('UPDATE shifts SET ended_at = ? WHERE staff_id = ? AND ended_at IS NULL').run(Date.now(), row.id); }
        }
        if (body.resetPin) {
          newPin = randomPin();
          P('UPDATE staff SET pin_hash = ?, pin_enc = ? WHERE id = ?').run(hashPin(newPin), encPin(newPin), row.id);
          P('DELETE FROM staff_sessions WHERE staff_id = ?').run(row.id);
        }
      });
      audit('admin', 'staff.update', `${row.name}: ${body.resetPin ? 'новый PIN ' : ''}${typeof body.active === 'boolean' ? (body.active ? 'включён' : 'отключён') : ''}`, req);
      return send(200, { ok: true, pin: newPin });
    }
    if (req.method === 'GET' && p === '/api/admin/shifts') {
      const from = Date.now() - Math.min(Math.max(+url.searchParams.get('days') || 7, 1), 90) * 86400e3;
      const rows = P('SELECT sh.*, s.name FROM shifts sh JOIN staff s ON s.id = sh.staff_id WHERE sh.started_at >= ? ORDER BY sh.started_at DESC LIMIT 200').all(from);
      return send(200, rows.map(r => ({
        id: r.id, name: r.name, locationId: r.location_id, startedAt: r.started_at, endedAt: r.ended_at,
        orders: P('SELECT COUNT(*) n FROM orders WHERE ready_by = ? AND ready_at >= ? AND ready_at <= ?').get(r.staff_id, r.started_at, r.ended_at || Date.now()).n
      })));
    }
    // отзывы: модерация и ответ владельца
    if (req.method === 'GET' && p === '/api/admin/reviews') {
      const rows = P('SELECT r.*, o.number FROM reviews r JOIN orders o ON o.token = r.order_token ORDER BY r.created_at DESC LIMIT 200').all();
      return send(200, rows.map(r => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, status: r.status, reply: r.reply, locationId: r.location_id, createdAt: r.created_at, orderNumber: r.number })));
    }
    const rvp = p.match(/^\/api\/admin\/reviews\/(\d+)$/);
    if (req.method === 'PATCH' && rvp) {
      const body = await readBody(req);
      if (!P('SELECT 1 FROM reviews WHERE id = ?').get(+rvp[1])) return send(404, { error: 'Отзыв не найден' });
      if (body.status === 'published' || body.status === 'hidden') { P('UPDATE reviews SET status = ? WHERE id = ?').run(body.status, +rvp[1]); audit('admin', 'review.' + body.status, 'id ' + rvp[1], req); }
      if (typeof body.reply === 'string') { P('UPDATE reviews SET reply = ? WHERE id = ?').run(clean(body.reply, 500), +rvp[1]); audit('admin', 'review.reply', 'id ' + rvp[1], req); }
      return send(200, { ok: true });
    }
    // меню: цены и «в продаже» правит владелец, без разработчика
    if (req.method === 'GET' && p === '/api/admin/menu') {
      const ov = new Map(P('SELECT item_id, variant, price FROM menu_overrides').all().map(r => [r.item_id + ':' + r.variant, r.price]));
      const hidden = new Set(P('SELECT item_id FROM item_hidden').all().map(r => r.item_id));
      return send(200, fullCategories().map(c => ({
        id: c.id, name: c.name, name_kk: c.name_kk, name_en: c.name_en,
        items: c.items.map(i => ({ id: i.id, custom: !!i.custom, name: i.name, name_kk: i.name_kk, name_en: i.name_en, hidden: hidden.has(i.id),
          variants: i.variants.map((v, idx) => ({ label: v.label, base: v.price, price: ov.has(i.id + ':' + idx) ? ov.get(i.id + ':' + idx) : v.price, overridden: ov.has(i.id + ':' + idx) })) }))
      })));
    }
    if (req.method === 'POST' && p === '/api/admin/menu/items') {
      const body = await readBody(req);
      const cat = baseMenu.categories.find(c => c.id === body.category);
      const name = clean(body.name, 80);
      if (!cat) return send(400, { error: 'Выберите категорию' });
      if (!name) return send(400, { error: 'Укажите название' });
      const vs = (Array.isArray(body.variants) ? body.variants : []).slice(0, 4);
      if (!vs.length || vs.some(v => !(Number.isInteger(v.price) && v.price >= 1 && v.price <= 1000000))) return send(400, { error: 'Цена: целое число от 1 до 1 000 000' });
      const data = { name, variants: vs.map(v => ({ label: clean(v.label, 20), price: v.price })) };
      const kk = clean(body.name_kk, 80), en = clean(body.name_en, 80);
      if (kk) data.name_kk = kk;
      if (en) data.name_en = en;
      const id = 'c-' + crypto.randomBytes(4).toString('hex');
      P('INSERT INTO menu_custom (id, category, data, created_at) VALUES (?,?,?,?)').run(id, cat.id, JSON.stringify(data), Date.now());
      MENU = buildMenu(); popCache.at = 0;
      audit('admin', 'menu.add', name + ' / ' + cat.id, req);
      return send(201, { ok: true, id });
    }
    const mi = p.match(/^\/api\/admin\/menu\/items\/([a-z0-9-]{1,40})$/);
    if (req.method === 'DELETE' && mi) {
      const row = P('SELECT data FROM menu_custom WHERE id = ?').get(mi[1]);
      if (!row) return send(404, { error: 'Удалять можно только добавленные позиции; остальные можно скрыть' });
      tx(db, () => {
        P('DELETE FROM menu_custom WHERE id = ?').run(mi[1]);
        P('DELETE FROM stoplist WHERE item_id = ?').run(mi[1]);
        P('DELETE FROM menu_overrides WHERE item_id = ?').run(mi[1]);
        P('DELETE FROM item_hidden WHERE item_id = ?').run(mi[1]);
      });
      STOP = loadStop(); MENU = buildMenu(); popCache.at = 0;
      audit('admin', 'menu.delete', JSON.parse(row.data).name, req);
      return send(200, { ok: true });
    }
    if (req.method === 'PATCH' && mi) {
      const body = await readBody(req);
      const item = fullCategories().flatMap(c => c.items).find(i => i.id === mi[1]);
      if (!item) return send(404, { error: 'Позиция не найдена' });
      if (Array.isArray(body.variants)) {
        for (const x of body.variants) if (x !== null && !(Number.isInteger(x) && x >= 1 && x <= 1000000)) return send(400, { error: 'Цена: целое число от 1 до 1 000 000' });
      }
      tx(db, () => {
        if (Array.isArray(body.variants)) item.variants.forEach((v, idx) => {
          const x = body.variants[idx];
          if (x === undefined) return;
          if (x === null) P('DELETE FROM menu_overrides WHERE item_id = ? AND variant = ?').run(item.id, idx);
          else P('INSERT OR REPLACE INTO menu_overrides (item_id, variant, price) VALUES (?,?,?)').run(item.id, idx, x);
        });
        if (typeof body.hidden === 'boolean') {
          if (body.hidden) P('INSERT OR IGNORE INTO item_hidden (item_id) VALUES (?)').run(item.id);
          else P('DELETE FROM item_hidden WHERE item_id = ?').run(item.id);
        }
      });
      MENU = buildMenu(); popCache.at = 0;
      audit('admin', 'menu.update', `${item.id}: ${JSON.stringify({ variants: body.variants, hidden: body.hidden })}`, req);
      return send(200, { ok: true });
    }
    // журнал, состояние системы, резервная копия
    if (req.method === 'GET' && p === '/api/admin/audit') {
      const rows = P('SELECT at, actor, action, detail, ip FROM audit ORDER BY id DESC LIMIT ?').all(Math.min(+url.searchParams.get('limit') || 50, 200));
      return send(200, rows);
    }
    if (req.method === 'GET' && p === '/api/admin/health') {
      const warnings = [];
      if (ADMIN_PIN.length < 8) warnings.push('adminPinShort');
      if (STAFF_PIN.length < 6) warnings.push('staffPinShort');
      if (DEMO) warnings.push('demoMode');
      if (!process.env.DATA_DIR && IS_PROD) warnings.push('noDisk');
      if (company.draft) warnings.push('legalDraft');
      let dbSize = 0; try { dbSize = fs.statSync(path.join(DATA_DIR, 'drinkstar.db')).size; } catch { /* нет файла */ }
      return send(200, { uptimeSec: Math.round((Date.now() - STARTED) / 1000), dbSizeKb: Math.round(dbSize / 1024), orders: P('SELECT COUNT(*) n FROM orders').get().n,
        customers: P('SELECT COUNT(*) n FROM customers').get().n, lastBackup: lastBackup(), node: process.version, warnings,
        payment: provider ? provider.name : 'none', sms: smsAllowed ? sms.name : 'blocked',
        net: { ip: clientIp(req), peer: req.socket.remoteAddress, xff: String(req.headers['x-forwarded-for'] || '') } });
    }
    if (req.method === 'GET' && p === '/api/admin/backup') {
      const tmp = path.join(BACKUP_DIR, 'download-' + crypto.randomBytes(4).toString('hex') + '.db');
      backupFile(tmp);
      const buf = fs.readFileSync(tmp); fs.rmSync(tmp, { force: true });
      audit('admin', 'backup.download', Math.round(buf.length / 1024) + ' КБ', req);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': buf.length, 'Content-Disposition': `attachment; filename="drinkstar-backup-${new Date().toISOString().slice(0, 10)}.db"`, 'Cache-Control': 'no-store', ...securityHeaders(req) });
      return res.end(buf);
    }
    const days = Math.min(Math.max(+url.searchParams.get('days') || 7, 1), 365);
    if (req.method === 'GET' && p === '/api/admin/stats') {
      const loc = url.searchParams.get('loc');
      const categories = new Map(baseMenu.categories.map(c => [c.id, c.name]));
      return send(200, analytics({ db, items: MENU.items, categories, locById, tzH: TZ_OFFSET_H, sla: PREP_SLA_MIN }, { days, locId: locById.has(loc) ? loc : null }));
    }
    if (req.method === 'GET' && p === '/api/admin/orders.csv') {
      audit('admin', 'export.csv', days + ' дн.', req);
      return sendText(req, res, 200, ordersCsv(days), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="drinkstar-orders-${days}d.csv"` });
    }
  }
  send(404, { error: 'Не найдено' });
}

// --- страницы с подстановками и служебные файлы ---
const serveStatic = createStatic(PUB);
function servePage(req, res, name, vars) {
  let html = fs.readFileSync(path.join(PUB, name), 'utf8');
  for (const [k, v] of Object.entries(vars)) html = html.split(k).join(v);
  sendBuffer(req, res, { body: Buffer.from(html), type: TYPES['.html'], ext: '.html' });
}
function special(req, res, url) {
  const p = url.pathname, base = baseUrl(req);
  if (p === '/healthz') {
    try { P('SELECT 1').get(); return sendJson(req, res, 200, { ok: true, uptime: Math.round((Date.now() - STARTED) / 1000) }); }
    catch { return sendJson(req, res, 503, { ok: false }); }
  }
  if (p === '/' || p === '/index.html') return servePage(req, res, 'index.html', { '{{BASE}}': base, '{{JSONLD}}': jsonLd(base) }), true;
  if (p === '/robots.txt') {
    return sendBuffer(req, res, { body: Buffer.from(`User-agent: *\nDisallow: /staff.html\nDisallow: /admin.html\nDisallow: /track.html\nDisallow: /pay-mock.html\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`), type: TYPES['.txt'], ext: '.txt' }), true;
  }
  if (p === '/sitemap.xml') {
    const urls = ['/', '/?lang=kk', '/?lang=en', '/legal.html?doc=privacy', '/legal.html?doc=terms', '/legal.html?doc=club'];
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${base}${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`;
    return sendBuffer(req, res, { body: Buffer.from(body), type: TYPES['.xml'], ext: '.xml' }), true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else if (!special(req, res, url)) serveStatic(req, res, url.pathname);
  } catch (e) {
    if (res.headersSent) { res.end(); return; }
    if (e instanceof HttpError) return sendJson(req, res, e.status, { error: e.message });
    console.error('Ошибка запроса:', req.method, req.url.split('?')[0], e.stack || e.message);
    sendJson(req, res, 500, { error: 'Внутренняя ошибка' });
  } finally {
    const ms = Date.now() - started;
    if (ms > 1500) console.warn(`Медленный запрос ${ms} мс: ${req.method} ${req.url.split('?')[0]}`);
  }
});
// ограничения на долгие и «висящие» соединения
server.headersTimeout = 20000;
server.requestTimeout = 30000;
server.keepAliveTimeout = 65000; // дольше, чем у балансировщика, иначе бывают случайные 502
server.maxHeadersCount = 60;

server.listen(PORT, () => {
  console.log(`DrinkStar: http://localhost:${PORT}`);
  console.log(`Персонал:  http://localhost:${PORT}/staff.html   (личные PIN бариста заводит владелец в аналитике; PIN менеджера из STAFF_PIN: ${STAFF_PIN === DEFAULT_STAFF_PIN ? DEFAULT_STAFF_PIN + ', смените!' : 'задан'})`);
  console.log(`Владелец:  http://localhost:${PORT}/admin.html   (PIN ${ADMIN_PIN === DEFAULT_ADMIN_PIN ? DEFAULT_ADMIN_PIN + ', смените!' : 'задан'})`);
  console.log(`Оплата:    ${provider ? provider.name + (provider.name === 'mock' ? ' (демо)' : '') : 'отключена, только на кассе'}`);
  console.log(`SMS:       ${smsAllowed ? sms.name + (sms.demo ? ' (демо: код показывается на странице)' : '') : 'отключены (демо запрещено в боевом режиме)'}`);
});
maintenance(); dailyBackup();
setInterval(maintenance, 30e3).unref();
setInterval(dailyBackup, 6 * 3600e3).unref();

// не падаем молча и не теряем данные при остановке сервиса
process.on('unhandledRejection', e => console.error('unhandledRejection:', e && e.stack || e));
process.on('uncaughtException', e => { console.error('uncaughtException:', e && e.stack || e); process.exit(1); });
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    console.log('Остановка: ' + sig);
    server.close(() => { try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); db.close(); } catch { /* уже закрыта */ } process.exit(0); });
    setTimeout(() => process.exit(0), 8000).unref();
  });
}
