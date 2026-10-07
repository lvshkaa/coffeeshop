// Ограничение частоты запросов в памяти: скользящее окно по ключу.
// Ключи не должны жить вечно, поэтому sweep() вычищает остывшие.
const buckets = new Map(); // key -> { t: [метки времени], w: максимальное окно в мс }

function arr(key, windowMs) {
  let b = buckets.get(key);
  if (!b) { b = { t: [], w: windowMs }; buckets.set(key, b); }
  if (windowMs > b.w) b.w = windowMs;
  const now = Date.now();
  if (b.t.length && now - b.t[0] >= windowMs) b.t = b.t.filter(x => now - x < windowMs);
  return b;
}

// Записать событие и сказать, превышен ли лимит (больше max событий за windowMs).
function hit(key, windowMs, max) {
  const b = arr(key, windowMs);
  b.t.push(Date.now());
  return b.t.length > max;
}
// Сколько неудач накоплено за окно (без записи нового события).
function count(key, windowMs) {
  const b = buckets.get(key);
  if (!b) return 0;
  const now = Date.now();
  return b.t.filter(x => now - x < windowMs).length;
}
function fail(key, windowMs) { arr(key, windowMs).t.push(Date.now()); }
function reset(key) { buckets.delete(key); }

function sweep() {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (!b.t.length || now - b.t[b.t.length - 1] >= b.w) buckets.delete(k);
  }
}
module.exports = { hit, count, fail, reset, sweep, size: () => buckets.size };
