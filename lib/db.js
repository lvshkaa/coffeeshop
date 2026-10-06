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
  addColumn('customers', 'marketing', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('orders', 'consent_version', 'TEXT');
  return db;
}

// Всё или ничего: при ошибке изменения откатываются.
function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { open, tx };
