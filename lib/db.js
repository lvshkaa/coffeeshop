// База данных: встроенный SQLite (node:sqlite, Node 22.13+). Один файл drinkstar.db.
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,          -- 7XXXXXXXXXX
  name TEXT NOT NULL DEFAULT '',
  bonus INTEGER NOT NULL DEFAULT 0,    -- текущий баланс, 1 бонус = 1 ₸
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sms_codes (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  token TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  location_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  payment TEXT NOT NULL,               -- online | cash | bonus
  paid INTEGER NOT NULL DEFAULT 0,
  paid_at INTEGER,
  expired INTEGER NOT NULL DEFAULT 0,
  pay_url TEXT,
  external_id TEXT,
  items TEXT NOT NULL,                 -- JSON
  total INTEGER NOT NULL,              -- сумма заказа до бонусов
  bonus_used INTEGER NOT NULL DEFAULT 0,
  bonus_refunded INTEGER NOT NULL DEFAULT 0,
  payable INTEGER NOT NULL,            -- к оплате деньгами
  cashback INTEGER NOT NULL DEFAULT 0, -- сколько бонусов начислится при выдаче
  cashback_done INTEGER NOT NULL DEFAULT 0,
  customer_id INTEGER REFERENCES customers(id)
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE TABLE IF NOT EXISTS bonus_tx (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,                -- cashback | order | refund | adjust
  order_token TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_customer ON bonus_tx(customer_id);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- сотрудники: личный PIN у каждого, по нему видно, кто принял и выдал заказ
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'barista',   -- barista | manager
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_pin ON staff(pin_hash);
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  location_id TEXT NOT NULL,              -- id кофейни или 'all' для менеджера
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);
CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  shift_id INTEGER REFERENCES shifts(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_token TEXT NOT NULL UNIQUE REFERENCES orders(token),
  customer_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  location_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published', -- published | hidden
  reply TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);
-- сессии владельца (вместо хранения PIN в браузере)
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
-- журнал действий: кто и что менял
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit(at);
-- меню: цены и видимость правит владелец без разработчика
CREATE TABLE IF NOT EXISTS menu_overrides (item_id TEXT NOT NULL, variant INTEGER NOT NULL, price INTEGER NOT NULL, PRIMARY KEY (item_id, variant));
CREATE TABLE IF NOT EXISTS item_hidden (item_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS menu_custom (id TEXT PRIMARY KEY, category TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL);
-- стоп-лист: чего нет в наличии в конкретной кофейне
CREATE TABLE IF NOT EXISTS stoplist (location_id TEXT NOT NULL, item_id TEXT NOT NULL, since INTEGER NOT NULL, PRIMARY KEY (location_id, item_id));

`;

function open(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, 'drinkstar.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  // поля согласий; для уже созданной базы добавляем столбцы, если их ещё нет
  const addColumn = (table, col, def) => {
    const cols = db.prepare('PRAGMA table_info(' + table + ')').all().map(c => c.name);
    if (!cols.includes(col)) db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + col + ' ' + def);
  };
  addColumn('customers', 'consent_at', 'INTEGER');
  addColumn('customers', 'consent_version', 'TEXT');
  addColumn('staff', 'location_id', 'TEXT');
  addColumn('customers', 'marketing', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('orders', 'consent_version', 'TEXT');
  for (const c of ['accepted_by', 'accepted_at', 'ready_by', 'ready_at', 'done_by', 'done_at']) addColumn('orders', c, 'INTEGER');
  return db;
}

// Всё или ничего: при ошибке изменения откатываются.
function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { open, tx };
