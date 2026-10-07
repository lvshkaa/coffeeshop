// Аналитика для сети кофеен. Считает то, что реально двигает деньги:
// выручка и средний чек с динамикой к прошлому периоду, пики по часам и дням недели,
// скорость приготовления (SLA), состав продаж, допродажи, удержание клиентов клуба,
// экономика бонусов, оценки гостей, сравнение точек и бариста, плюс готовые выводы.
const DAY = 86400e3;
const VALID = "status NOT IN ('cancelled','awaiting_payment')";

function pct(a, p) { // перцентиль по массиву чисел
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}
const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const round1 = n => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
const delta = (cur, prev) => (prev ? Math.round((cur - prev) / prev * 1000) / 10 : null); // % изменения

// Сводка по набору заказов (только состоявшиеся: не отменённые и не ждущие оплаты)
function summarize(rows, ctx) {
  const t = { orders: 0, revenue: 0, money: 0, bonusSpent: 0, cashbackAccrued: 0, online: 0, cash: 0, members: 0, lines: 0, units: 0 };
  const prep = [];
  for (const r of rows) {
    t.orders++; t.revenue += r.total; t.money += r.payable; t.bonusSpent += r.bonus_used;
    if (r.cashback_done) t.cashbackAccrued += r.cashback;
    if (r.payment === 'online') t.online++; else if (r.payment === 'cash') t.cash++;
    if (r.customer_id) t.members++;
    for (const i of JSON.parse(r.items)) { t.lines++; t.units += i.qty; }
    if (r.ready_at) prep.push((r.ready_at - r.created_at) / 60000);
  }
  return {
    ...t,
    avgCheck: t.orders ? Math.round(t.revenue / t.orders) : 0,
    itemsPerOrder: t.orders ? round1(t.units / t.orders) : 0,
    avgPrepMin: round1(avg(prep)), p90PrepMin: round1(pct(prep, 0.9)),
    slaOverShare: prep.length ? Math.round(prep.filter(m => m > ctx.sla).length / prep.length * 100) : null
  };
}

function analytics(ctx, { days, locId }) {
  const { db, items, categories, locById, tzH, sla = 7 } = ctx;
  const now = Date.now();
  const dayStart = ts => Math.floor((ts + tzH * 3600e3) / DAY) * DAY - tzH * 3600e3;
  const from = dayStart(now) - (days - 1) * DAY;
  const prevFrom = from - days * DAY;
  const inLoc = r => !locId || r.location_id === locId;

  // заказы за период и за предыдущий такой же период
  const all = db.prepare('SELECT * FROM orders WHERE created_at >= ? ORDER BY created_at').all(prevFrom).filter(inLoc);
  const cur = all.filter(r => r.created_at >= from), prev = all.filter(r => r.created_at < from);
  const ok = rs => rs.filter(r => r.status !== 'cancelled' && r.status !== 'awaiting_payment');
  const rows = ok(cur), prevRows = ok(prev);
  const T = summarize(rows, ctx), P = summarize(prevRows, ctx);

  // отмены и просроченные оплаты
  const cancelled = cur.filter(r => r.status === 'cancelled' && !r.expired).length;
  const expired = cur.filter(r => r.expired).length;
  const attempts = cur.filter(r => r.status !== 'awaiting_payment').length;
  const onlineAttempts = cur.filter(r => r.payment === 'online' && r.status !== 'awaiting_payment').length;

  // по дням, часам, дням недели
  const byDay = {}, byHour = Array.from({ length: 24 }, () => ({ orders: 0, revenue: 0, prepSum: 0, prepN: 0 }));
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0)); // пн..вс × 0..23
  const dow = Array.from({ length: 7 }, () => ({ orders: 0, revenue: 0 }));
  const cats = {}, addonCount = {};
  let drinkLines = 0, drinkLinesWithAddon = 0;
  const top = {}, byLoc = {};
  for (const r of rows) {
    const local = new Date(r.created_at + tzH * 3600e3);
    const day = local.toISOString().slice(0, 10), hour = local.getUTCHours(), wd = (local.getUTCDay() + 6) % 7;
    (byDay[day] ||= { date: day, orders: 0, revenue: 0 }).orders++; byDay[day].revenue += r.total;
    const H = byHour[hour]; H.orders++; H.revenue += r.total;
    if (r.ready_at) { H.prepSum += (r.ready_at - r.created_at) / 60000; H.prepN++; }
    heat[wd][hour]++; dow[wd].orders++; dow[wd].revenue += r.total;
    const L = byLoc[r.location_id] ||= { id: r.location_id, orders: 0, revenue: 0, prep: [] };
    L.orders++; L.revenue += r.total; if (r.ready_at) L.prep.push((r.ready_at - r.created_at) / 60000);
    for (const i of JSON.parse(r.items)) {
      const meta = items.get(i.id);
      const cat = meta ? meta.category : 'other';
      const C = cats[cat] ||= { id: cat, revenue: 0, qty: 0 };
      C.revenue += i.unit * i.qty; C.qty += i.qty;
      const k = i.name + (i.variant ? ' ' + i.variant : '');
      const X = top[k] ||= { id: i.id, variant: i.variant, name: k, qty: 0, revenue: 0 };
      X.qty += i.qty; X.revenue += i.unit * i.qty;
      if (cat !== 'food' && cat !== 'other') {
        drinkLines++; if (i.addonIds && i.addonIds.length) drinkLinesWithAddon++;
        for (const a of (i.addonIds || [])) addonCount[a] = (addonCount[a] || 0) + i.qty;
      }
    }
  }
  const days_ = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from + i * DAY + tzH * 3600e3).toISOString().slice(0, 10);
    days_.push(byDay[d] || { date: d, orders: 0, revenue: 0 });
  }

  // клиенты клуба: новые и вернувшиеся, повторные заказы, удержание за 30 дней
  const firstOrder = new Map(db.prepare(`SELECT customer_id, MIN(created_at) f FROM orders WHERE customer_id IS NOT NULL AND ${VALID} GROUP BY customer_id`).all().map(r => [r.customer_id, r.f]));
  const memberOrders = {};
  let ordersFromNew = 0, ordersFromReturning = 0;
  for (const r of rows) {
    if (!r.customer_id) continue;
    memberOrders[r.customer_id] = (memberOrders[r.customer_id] || 0) + 1;
    if ((firstOrder.get(r.customer_id) ?? 0) >= from) ordersFromNew++; else ordersFromReturning++;
  }
  const memberCount = Object.keys(memberOrders).length;
  const repeatMembers = Object.values(memberOrders).filter(n => n >= 2).length;
  // когорта: впервые заказали за 30..60 дней до конца периода и вернулись в течение 30 дней
  const cohortFrom = from - 30 * DAY;
  const cohort = [...firstOrder].filter(([, f]) => f >= cohortFrom && f < from).map(([id, f]) => ({ id, f }));
  let returned = 0;
  if (cohort.length) {
    const q = db.prepare(`SELECT COUNT(*) n FROM orders WHERE customer_id = ? AND ${VALID} AND created_at > ? AND created_at <= ?`);
    for (const c of cohort) if (q.get(c.id, c.f + 60000, c.f + 30 * DAY).n > 0) returned++;
  }
  const bonusOutstanding = db.prepare('SELECT COALESCE(SUM(bonus), 0) n FROM customers').get().n;

  // отзывы
  const rv = (a, b) => db.prepare("SELECT COUNT(*) n, COALESCE(AVG(rating), 0) a FROM reviews WHERE status = 'published' AND created_at >= ? AND created_at < ?" + (locId ? ' AND location_id = ?' : '')).get(...(locId ? [a, b, locId] : [a, b]));
  const rvNow = rv(from, now + 1), rvPrev = rv(prevFrom, from);
  const unanswered = db.prepare("SELECT COUNT(*) n FROM reviews WHERE status = 'published' AND rating <= 3 AND reply = ''" + (locId ? ' AND location_id = ?' : '')).get(...(locId ? [locId] : [])).n;

  // точки: деньги, скорость и оценка
  const openHours = l => { const [a, b] = [l.open, l.close].map(x => +x.slice(0, 2) + +x.slice(3) / 60); return Math.max(1, b - a); };
  const rvByLoc = Object.fromEntries(db.prepare("SELECT location_id, COUNT(*) n, AVG(rating) a FROM reviews WHERE status = 'published' AND created_at >= ? GROUP BY location_id").all(from).map(r => [r.location_id, r]));
  const byLocation = Object.values(byLoc).map(L => {
    const meta = locById.get(L.id);
    return { id: L.id, orders: L.orders, revenue: L.revenue, avgCheck: Math.round(L.revenue / L.orders), avgPrepMin: round1(avg(L.prep)),
      revenuePerOpenHour: meta ? Math.round(L.revenue / (openHours(meta) * days)) : null, rating: rvByLoc[L.id] ? round1(rvByLoc[L.id].a) : null, reviews: rvByLoc[L.id]?.n || 0 };
  }).sort((a, b) => b.revenue - a.revenue);

  // бариста
  const staff = db.prepare(`SELECT s.id, s.name, COUNT(*) orders, ROUND(AVG(o.ready_at - o.created_at) / 60000.0, 1) avgMin
      FROM orders o JOIN staff s ON s.id = o.ready_by WHERE o.created_at >= ? AND o.ready_at IS NOT NULL${locId ? ' AND o.location_id = ?' : ''}
      GROUP BY s.id ORDER BY orders DESC`).all(...(locId ? [from, locId] : [from]));

  const topItems = Object.values(top).sort((a, b) => b.qty - a.qty).slice(0, 10);
  const categoryMix = Object.values(cats).sort((a, b) => b.revenue - a.revenue)
    .map(c => ({ ...c, name: categories.get(c.id) || c.id, share: T.revenue ? Math.round(c.revenue / T.revenue * 100) : 0 }));
  const hours = byHour.map((h, i) => ({ hour: i, orders: h.orders, revenue: h.revenue, avgPrepMin: h.prepN ? round1(h.prepSum / h.prepN) : null }));
  const attach = drinkLines ? Math.round(drinkLinesWithAddon / drinkLines * 100) : null;

  const out = {
    days, sla,
    totals: {
      ...T, prev: { orders: P.orders, revenue: P.revenue, avgCheck: P.avgCheck, avgPrepMin: P.avgPrepMin },
      delta: { orders: delta(T.orders, P.orders), revenue: delta(T.revenue, P.revenue), avgCheck: delta(T.avgCheck, P.avgCheck) },
      cancelled, expired, cancelRate: attempts ? round1((cancelled + expired) / attempts * 100) : 0,
      expiredShare: onlineAttempts ? round1(expired / onlineAttempts * 100) : 0,
      onlineShare: T.orders ? Math.round(T.online / T.orders * 100) : 0
    },
    byDay: days_, byHour: hours, heat, byWeekday: dow, topItems, categoryMix, byLocation, staff,
    upsell: { attach, drinkLines, addons: addonCount },
    club: {
      totalMembers: db.prepare('SELECT COUNT(*) n FROM customers').get().n,
      newMembers: db.prepare('SELECT COUNT(*) n FROM customers WHERE created_at >= ?').get(from).n,
      activeMembers: memberCount, repeatMembers, repeatShare: memberCount ? Math.round(repeatMembers / memberCount * 100) : null,
      ordersFromNew, ordersFromReturning, memberShare: T.orders ? Math.round(T.members / T.orders * 100) : 0,
      retention30: cohort.length >= 5 ? Math.round(returned / cohort.length * 100) : null, cohortSize: cohort.length,
      bonusOutstanding, cashbackShare: T.revenue ? round1(T.cashbackAccrued / T.revenue * 100) : 0,
      redemption: T.cashbackAccrued ? Math.round(T.bonusSpent / T.cashbackAccrued * 100) : null
    },
    reviews: { count: rvNow.n, avg: round1(rvNow.a), prevAvg: rvPrev.n ? round1(rvPrev.a) : null, prevCount: rvPrev.n, unanswered }
  };
  out.insights = insights(out, { days, locById });
  return out;
}

// Готовые выводы: простые правила, которые превращают цифры в действия.
// Возвращаем коды и числа, а тексты подставляет интерфейс на нужном языке.
function insights(a, { locById }) {
  const out = [];
  const T = a.totals;
  if (!T.orders) return out;
  const peak = [...a.byHour].sort((x, y) => y.orders - x.orders)[0];
  if (peak && peak.orders >= 3) out.push({ k: 'peak', sev: 'info', v: { hour: peak.hour, orders: peak.orders, share: Math.round(peak.orders / T.orders * 100) } });
  const slowPeak = [...a.byHour].filter(h => h.orders >= 3 && h.avgPrepMin && h.avgPrepMin > a.sla).sort((x, y) => y.orders - x.orders)[0];
  if (slowPeak) out.push({ k: 'slowPeak', sev: 'warn', v: { hour: slowPeak.hour, min: slowPeak.avgPrepMin, sla: a.sla } });
  else if (T.slaOverShare !== null && T.slaOverShare >= 25) out.push({ k: 'sla', sev: 'warn', v: { share: T.slaOverShare, sla: a.sla } });
  if (T.delta.revenue !== null && T.delta.revenue >= 10) out.push({ k: 'growth', sev: 'good', v: { pct: T.delta.revenue } });
  if (T.delta.revenue !== null && T.delta.revenue <= -10) out.push({ k: 'decline', sev: 'warn', v: { pct: Math.abs(T.delta.revenue) } });
  const topCat = a.categoryMix[0];
  if (topCat && topCat.share >= 50) out.push({ k: 'topCategory', sev: 'info', v: { cat: topCat.id, name: topCat.name, share: topCat.share } });
  if (a.upsell.attach !== null && a.upsell.drinkLines >= 10 && a.upsell.attach < 15) out.push({ k: 'upsellLow', sev: 'info', v: { share: a.upsell.attach } });
  if (T.cancelRate >= 5 && (T.cancelled + T.expired) >= 3) out.push({ k: 'cancelHigh', sev: 'warn', v: { rate: T.cancelRate } });
  if (T.expired >= 3 && T.expiredShare >= 10) out.push({ k: 'unpaid', sev: 'warn', v: { count: T.expired, share: T.expiredShare } });
  const withRev = a.byLocation.filter(l => l.revenuePerOpenHour);
  if (withRev.length >= 3) {
    const mean = withRev.reduce((s, l) => s + l.revenuePerOpenHour, 0) / withRev.length;
    const worst = [...withRev].sort((x, y) => x.revenuePerOpenHour - y.revenuePerOpenHour)[0];
    if (worst.revenuePerOpenHour < mean * 0.6) out.push({ k: 'locLag', sev: 'info', v: { id: worst.id, pct: Math.round(worst.revenuePerOpenHour / mean * 100) } });
  }
  if (a.reviews.unanswered > 0) out.push({ k: 'reviewsUnanswered', sev: 'warn', v: { count: a.reviews.unanswered } });
  if (a.reviews.prevAvg !== null && a.reviews.count >= 5 && a.reviews.avg - a.reviews.prevAvg <= -0.3) out.push({ k: 'ratingDrop', sev: 'warn', v: { from: a.reviews.prevAvg, to: a.reviews.avg } });
  const monthly = T.revenue / Math.max(1, a.days) * 30;
  if (monthly > 0 && a.club.bonusOutstanding > monthly * 0.15) out.push({ k: 'bonusLiability', sev: 'warn', v: { amount: a.club.bonusOutstanding, share: Math.round(a.club.bonusOutstanding / monthly * 100) } });
  if (a.club.retention30 !== null) out.push({ k: 'retention', sev: a.club.retention30 >= 30 ? 'good' : 'info', v: { pct: a.club.retention30, size: a.club.cohortSize } });
  const days7 = a.byWeekday.map((d, i) => ({ i, ...d })).filter(d => d.orders > 0);
  if (days7.length >= 4) {
    const best = [...days7].sort((x, y) => y.revenue - x.revenue)[0], worst = [...days7].sort((x, y) => x.revenue - y.revenue)[0];
    if (best.revenue >= worst.revenue * 1.5) out.push({ k: 'weekday', sev: 'info', v: { best: best.i, worst: worst.i } });
  }
  const order = { warn: 0, good: 1, info: 2 };
  return out.sort((x, y) => order[x.sev] - order[y.sev]).slice(0, 7);
}

module.exports = { analytics };
