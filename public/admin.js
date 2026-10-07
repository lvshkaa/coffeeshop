const $ = s => document.querySelector(s);
const { LANG, LOCALE } = window.I18N;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
const num = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');
const dt = ts => new Date(ts).toLocaleString(LOCALE, { timeZone: 'Asia/Almaty', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
let token = sessionStorage.getItem('ds_atoken') || '';
let LOCS = {}, ITEMS = {}, view = 'stats';
const H = () => ({ 'Content-Type': 'application/json', 'x-admin-token': token });
const A = (url, opt = {}) => fetch(url, { ...opt, headers: H() });
const locName = id => id === 'all' ? t('sf.allloc') : (LOCS[id] ? tr(LOCS[id], 'address') : id);
const itemLabel = i => (ITEMS[i.id] ? tr(ITEMS[i.id], 'name') + (i.variant ? ' ' + I18N.num(i.variant) : '') : i.name);
const stars = n => Array.from({ length: 5 }, (_, i) => ic('star', i < n ? '' : 'ic-off')).join('');

// ---------- вкладки ----------
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => show(b.dataset.view));
function show(v) {
  view = v;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  ['stats', 'staff', 'reviews', 'menu', 'sys'].forEach(x => $('#view-' + x).hidden = x !== v);
  $('#statsCtl').style.display = v === 'stats' ? 'contents' : 'none';
  load();
}
async function load() {
  try {
    if (view === 'stats') await loadStats();
    else if (view === 'staff') await loadStaff();
    else if (view === 'reviews') await loadReviews();
    else if (view === 'menu') await loadMenu();
    else await loadSys();
  } catch (e) { /* нет связи */ }
}

// ---------- аналитика ----------
async function loadStats() {
  const q = `days=${$('#days').value}&loc=${$('#loc').value}`;
  const r = await A('/api/admin/stats?' + q);
  if (r.status === 401 || r.status === 429) return logout();
  renderStats(await r.json());
}
function bars(arr, key, label) {
  const max = Math.max(1, ...arr.map(a => a[key]));
  return `<div class="bars">${arr.map(a => `<div style="height:${Math.max(2, a[key] / max * 100)}%" data-t="${esc(label(a))}"></div>`).join('')}</div>`;
}
const wd = i => new Date(2024, 0, 1 + i).toLocaleDateString(LOCALE, { weekday: 'short' });
const delta = d => d === null || d === undefined ? '' : `<span class="delta ${d >= 0 ? 'up' : 'down'}" title="${esc(tp('ad.vsprev'))}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}%</span>`;
function insightText(i) {
  const v = { ...i.v };
  if (i.k === 'locLag') v.name = locName(v.id);
  if (i.k === 'weekday') { v.best = wd(v.best); v.worst = wd(v.worst); }
  if (i.k === 'amount' || v.amount !== undefined) v.amount = num(v.amount);
  return tp('in.' + i.k, v);
}
function heatmap(h) {
  const max = Math.max(1, ...h.flat());
  const hours = Array.from({ length: 24 }, (_, x) => `<span class="hh">${x % 3 === 0 ? x : ''}</span>`).join('');
  const rows = h.map((r, d) => `<i>${esc(wd(d))}</i>` + r.map((n, x) => `<u style="opacity:${n ? 0.15 + n / max * 0.85 : 0.06}" title="${esc(wd(d))} ${x}:00 · ${n} ${esc(tp('ad.ord'))}"></u>`).join('')).join('');
  return `<div class="heat"><i></i>${hours}${rows}</div>`;
}
function renderStats(s) {
  const tt = s.totals, c = s.club, rv = s.reviews || { count: 0, avg: 0 };
  const total = tt.online + tt.cash || 1;
  const topMax = Math.max(1, ...s.topItems.map(i => i.qty));
  $('#view-stats').innerHTML = `
  ${s.insights.length ? `<div class="card" style="margin-bottom:16px"><h2>${t('ad.insights')}</h2><div class="insights">${s.insights.map(i => `<div class="ins ${i.sev}">${esc(insightText(i))}</div>`).join('')}</div></div>` : ''}
  <div class="kpis">
    <div class="kpi"><span>${t('ad.revenue')}</span><b>${fmt(tt.revenue)}${delta(tt.delta.revenue)}</b><small>${t('ad.revenue.s')}</small></div>
    <div class="kpi"><span>${t('ad.orders')}</span><b>${num(tt.orders)}${delta(tt.delta.orders)}</b><small>${t('ad.orders.s')}</small></div>
    <div class="kpi"><span>${t('ad.avg')}</span><b>${fmt(tt.avgCheck)}${delta(tt.delta.avgCheck)}</b></div>
    <div class="kpi"><span>${t('ad.money')}</span><b>${fmt(tt.money)}</b><small>${t('ad.money.s', { n: fmt(tt.bonusSpent) })}</small></div>
    <div class="kpi"><span>${t('ad.clubshare')}</span><b>${tt.orders ? Math.round(tt.members / tt.orders * 100) : 0}%</b><small>${t('ad.clubshare.s', { a: num(tt.members), b: num(tt.orders) })}</small></div>
    <div class="kpi"><span>${t('ad.members')}</span><b>${num(c.totalMembers)}</b><small>${t('ad.members.s', { a: num(c.newMembers), b: num(c.repeatMembers) })}</small></div>
    <div class="kpi"><span>${t('ad.bonus')}</span><b>${num(c.bonusOutstanding)}</b><small>${t('ad.bonus.s', { n: num(tt.cashbackAccrued) })}</small></div>
    <div class="kpi"><span>${t('ad.rating')}</span><b>${rv.count ? rv.avg.toFixed(1) : '—'}</b><small>${t('ad.rating.s', { n: num(rv.count) })}</small></div>
    <div class="kpi"><span>${t('ad.sla')}</span><b>${tt.avgPrepMin ? tt.avgPrepMin + ' min' : '—'}</b><small>${t('ad.sla.s', { n: s.sla })}</small></div>
    <div class="kpi"><span>${t('ad.attach')}</span><b>${s.upsell.attach === null ? '—' : s.upsell.attach + '%'}</b><small>${t('ad.attach.s')}</small></div>
    <div class="kpi"><span>${t('ad.ret')}</span><b>${c.retention30 === null ? '—' : c.retention30 + '%'}</b><small>${c.retention30 === null ? t('ad.na') : t('ad.ret.s', { n: num(c.cohortSize) })}</small></div>
    <div class="kpi"><span>${t('ad.cancel')}</span><b>${tt.cancelRate}%</b><small>${t('ad.cancel.s')}</small></div>
  </div>
  ${!tt.orders ? `<p class="empty" style="margin-top:20px">${t('ad.none')}</p>` : `
  <div class="grid">
    <div class="card wide"><h2>${t('ad.byday')}</h2>${bars(s.byDay, 'revenue', d => `${d.date}: ${fmt(d.revenue)}, ${d.orders} ${tp('ad.ord')}`)}
      <div class="axis"><span>${s.byDay[0].date}</span><span>${s.byDay[s.byDay.length - 1].date}</span></div></div>
    <div class="card wide"><h2>${t('ad.heat')}</h2>${heatmap(s.heat)}</div>
    <div class="card"><h2>${t('ad.byhour')}</h2>${bars(s.byHour, 'orders', h => `${h.hour}:00, ${h.orders} ${tp('ad.ord')}`)}
      <div class="axis"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div></div>
    <div class="card"><h2>${t('ad.cats')}</h2><div class="list">${s.categoryMix.map(k => `<div><div class="r"><span>${esc(k.name)}</span><i>${k.share}% · ${fmt(k.revenue)}</i></div><div class="meter"><div style="width:${k.share}%"></div></div></div>`).join('')}</div></div>
    <div class="card"><h2>${t('ad.paytype')}</h2>
      <div class="list"><div class="r"><span>${t('ad.online')}</span><i>${num(tt.online)} · ${Math.round(tt.online / total * 100)}%</i></div><div class="meter"><div style="width:${tt.online / total * 100}%"></div></div>
      <div class="r" style="margin-top:8px"><span>${t('ad.cash')}</span><i>${num(tt.cash)} · ${Math.round(tt.cash / total * 100)}%</i></div><div class="meter"><div style="width:${tt.cash / total * 100}%"></div></div></div></div>
    <div class="card"><h2>${t('ad.top')}</h2><div class="list">${s.topItems.map(i => `<div><div class="r"><span>${esc(itemLabel(i))}</span><i>${num(i.qty)} ${t('ad.pcs')} · ${fmt(i.revenue)}</i></div><div class="meter"><div style="width:${i.qty / topMax * 100}%"></div></div></div>`).join('')}</div></div>
    <div class="card wide"><h2>${t('ad.byloc')}</h2><div class="list">${s.byLocation.map(l => `<div class="r"><span>${esc(locName(l.id))}${l.rating ? ' · ★ ' + l.rating : ''}</span><i>${num(l.orders)} ${t('ad.ord')} · ${fmt(l.revenue)}${l.revenuePerOpenHour ? ' · ' + fmt(l.revenuePerOpenHour) + ' ' + t('ad.revloc') : ''}</i></div>`).join('')}</div></div>
    ${(s.staff && s.staff.length) ? `<div class="card wide"><h2>${t('ad.bybarista')}</h2><div class="list">${s.staff.map(b => `<div class="r"><span>${esc(b.name)}</span><i>${num(b.orders)} ${t('ad.ord')} · ${tp('ad.avgmin', { n: b.avgMin })}</i></div>`).join('')}</div></div>` : ''}
  </div>`}`;
}

// ---------- сотрудники ----------
let newPinMsg = '';
async function loadStaff() {
  const [sr, shr] = await Promise.all([A('/api/admin/staff'), A('/api/admin/shifts?days=7')]);
  if (sr.status === 401 || sr.status === 429) return logout();
  renderStaff(await sr.json(), await shr.json());
}
function renderStaff(list, shifts) {
  $('#view-staff').innerHTML = `
    ${newPinMsg ? `<div class="pinbox">${newPinMsg}</div>` : ''}
    <div class="card">
      <h2>${t('sf.add')}</h2>
      <form class="addform" id="addForm">
        <label>${t('sf.name')}<input name="name" maxlength="40" required></label>
        <label>${t('sf.role')}<select name="role"><option value="barista">${t('sf.barista')}</option><option value="manager">${t('sf.manager')}</option></select></label>
        <label>${t('sf.home')}<select name="loc"><option value="">${t('sf.nohome')}</option>${Object.values(LOCS).map(l => `<option value="${l.id}">${esc(tr(l, 'address'))}</option>`).join('')}</select></label>
        <label>${t('sf.pin')}<input name="pin" inputmode="numeric" maxlength="8" autocomplete="off"></label>
        <button class="btn" type="submit">${ic('users')} ${t('sf.create')}</button>
      </form>
    </div>
    <div class="card" style="margin-top:16px">
      <h2>${t('sf.title')}</h2>
      ${list.map(s => `<div class="staff-row">
        <div class="nm">${esc(s.name)} <span class="badge ${s.role === 'manager' ? 'mgr' : 'off'}">${t('sf.' + s.role)}</span> ${s.active ? '' : `<span class="badge hid">${t('sf.inactive')}</span>`}</div>
        <div class="meta">${s.onShift ? `<span class="badge on">${t('sf.onshift')}</span> ${esc(locName(s.onShift))}` : `<span class="badge off">${t('sf.offshift')}</span>`}
          · ${s.lastShift ? `${t('sf.lastshift')}: ${dt(s.lastShift)}` : t('sf.never')} · ${t('sf.handled', { n: s.handled30 })}</div>
        <select class="homesel" data-home="${s.id}" aria-label="${esc(tp('sf.home'))}"><option value="">${t('sf.nohome')}</option>${Object.values(LOCS).map(l => `<option value="${l.id}"${s.locationId === l.id ? ' selected' : ''}>${esc(tr(l, 'address'))}</option>`).join('')}</select>
        <button class="btn sec sm" data-showpin="${s.id}">${ic('eye')} ${t('sf.showpin')}</button>
        <button class="btn sec sm" data-act="reset" data-id="${s.id}">${ic('key-round')} ${t('sf.reset')}</button>
        <button class="btn ${s.active ? 'danger' : 'sec'} sm" data-act="${s.active ? 'off' : 'on'}" data-id="${s.id}">${s.active ? t('sf.deactivate') : t('sf.activate')}</button>
      </div>`).join('')}
    </div>
    <div class="card" style="margin-top:16px">
      <h2>${t('sf.shifts')}</h2>
      ${shifts.length ? `<div class="tw"><table class="t"><thead><tr><th>${t('sf.col.staff')}</th><th>${t('sf.col.loc')}</th><th>${t('sf.col.start')}</th><th>${t('sf.col.end')}</th><th>${t('sf.col.orders')}</th></tr></thead><tbody>
        ${shifts.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(locName(x.locationId))}</td><td>${dt(x.startedAt)}</td><td>${x.endedAt ? dt(x.endedAt) : `<span class="badge on">${t('sf.ongoing')}</span>`}</td><td>${num(x.orders)}</td></tr>`).join('')}
      </tbody></table></div>` : `<p class="empty">—</p>`}
    </div>`;
  $('#addForm').onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    const r = await A('/api/admin/staff', { method: 'POST', body: JSON.stringify({ name: f.name.value, role: f.role.value, locationId: f.loc.value, pin: f.pin.value }) });
    const d = await r.json();
    if (!r.ok) { alert(d.error || 'Error'); return; }
    newPinMsg = tp('sf.pinis', { name: esc(f.name.value), pin: '@@' + d.pin + '@@' }).replace(/@@(\d+)@@/, '<b>$1</b>');
    loadStaff();
  };
  document.querySelectorAll('[data-showpin]').forEach(b => b.onclick = async () => {
    const row = list.find(x => String(x.id) === b.dataset.showpin);
    const d = await (await A('/api/admin/staff/' + b.dataset.showpin + '/pin')).json();
    newPinMsg = d.pin ? tp('sf.pinis', { name: esc(row.name), pin: '@@' + d.pin + '@@' }).replace(/@@(\d+)@@/, '<b>$1</b>') : esc(tp('sf.pinunknown', { name: row.name }));
    loadStaff();
  });
  document.querySelectorAll('[data-home]').forEach(sel => sel.onchange = async () => {
    await A('/api/admin/staff/' + sel.dataset.home, { method: 'PATCH', body: JSON.stringify({ locationId: sel.value }) });
    newPinMsg = esc(tp('sf.moved'));
    loadStaff();
  });
  document.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
    const id = b.dataset.id, act = b.dataset.act, row = list.find(x => String(x.id) === id);
    if (act === 'reset' && !confirm(tp('sf.confirmreset'))) return;
    const body = act === 'reset' ? { resetPin: true } : { active: act === 'on' };
    const r = await A('/api/admin/staff/' + id, { method: 'PATCH', body: JSON.stringify(body) });
    const d = await r.json();
    if (d.pin) newPinMsg = tp('sf.pinis', { name: esc(row.name), pin: '@@' + d.pin + '@@' }).replace(/@@(\d+)@@/, '<b>$1</b>');
    loadStaff();
  });
}

// ---------- отзывы ----------
async function loadReviews() {
  const r = await A('/api/admin/reviews');
  if (r.status === 401 || r.status === 429) return logout();
  renderReviews(await r.json());
}
function renderReviews(list) {
  $('#view-reviews').innerHTML = `<div class="card"><h2>${t('rw.title')}</h2>${list.length ? list.map(r => `
    <div class="rv" data-id="${r.id}">
      <div class="rv-top"><span class="st">${stars(r.rating)}</span><span>${esc(r.name || '—')}</span><small>${esc(locName(r.locationId))} · ${t('rw.order', { n: r.orderNumber })} · ${dt(r.createdAt)}</small>${r.status === 'hidden' ? `<span class="badge hid">${t('rw.hidden')}</span>` : ''}</div>
      ${r.text ? `<p>${esc(r.text)}</p>` : ''}
      <textarea placeholder="${esc(tp('rw.replyph'))}" maxlength="500">${esc(r.reply)}</textarea>
      <div class="row"><button class="btn sm" data-save>${t('rw.save')}</button>
      <button class="btn sec sm" data-toggle="${r.status === 'hidden' ? 'published' : 'hidden'}">${ic(r.status === 'hidden' ? 'eye' : 'eye-off')} ${r.status === 'hidden' ? t('rw.show') : t('rw.hide')}</button></div>
    </div>`).join('') : `<p class="empty">${t('rw.none')}</p>`}</div>`;
  document.querySelectorAll('.rv').forEach(el => {
    const id = el.dataset.id;
    el.querySelector('[data-save]').onclick = async () => { await A('/api/admin/reviews/' + id, { method: 'PATCH', body: JSON.stringify({ reply: el.querySelector('textarea').value }) }); loadReviews(); };
    el.querySelector('[data-toggle]').onclick = async e => { await A('/api/admin/reviews/' + id, { method: 'PATCH', body: JSON.stringify({ status: e.currentTarget.dataset.toggle }) }); loadReviews(); };
  });
}

// ---------- меню и цены ----------
async function loadMenu() {
  const r = await A('/api/admin/menu');
  if (r.status === 401 || r.status === 429) return logout();
  const cats = await r.json();
  $('#view-menu').innerHTML = `<div class="card"><h2>${t('mn.title')}</h2><p class="empty" style="margin-bottom:10px">${t('mn.hint')}</p>
    <form class="addform" id="addItem" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:8px">
      <label>${t('mn.f.name')}<input name="name" required maxlength="80"></label>
      <label>${t('mn.f.kk')}<input name="kk" maxlength="80"></label>
      <label>${t('mn.f.en')}<input name="en" maxlength="80"></label>
      <label>${t('mn.f.cat')}<select name="cat">${cats.map(c => `<option value="${c.id}">${esc(tr(c, 'name'))}</option>`).join('')}</select></label>
      <label>${t('mn.f.size')}<input name="size" maxlength="20"></label>
      <label>${t('mn.f.price')}<input name="price" type="number" min="1" step="1" required></label>
      <button class="btn">${ic('plus')} ${t('mn.add')}</button></form><p class="loginErr" id="addErr" style="color:var(--red);font-weight:700"></p>
    ${cats.map(c => `<h3 style="margin:18px 0 4px;font-family:var(--serif)">${esc(tr(c, 'name'))}</h3>${c.items.map(i => `
    <div class="mrow" data-id="${i.id}"><div class="nm">${esc(tr(i, 'name'))}${i.hidden ? ` <small>${t('mn.hidden')}</small>` : ''}${i.custom ? ` <small>${t('mn.custom')}</small>` : ''}</div>
      ${i.variants.map((v, idx) => `<label style="font-size:.75rem;font-weight:700;color:var(--muted)">${esc(v.label || '')}<br><input type="number" min="1" step="1" data-v="${idx}" data-base="${v.base ?? ''}" value="${v.price ?? ''}" placeholder="${esc(tp('mn.noprice'))}" class="${v.overridden ? 'mod' : ''}"></label>`).join('')}
      <button class="btn sm" data-save>${t('mn.save')}</button>
      <button class="btn sec sm" data-reset>${t('mn.reset')}</button>
      <button class="btn sec sm" data-hide="${i.hidden ? 0 : 1}">${i.hidden ? t('mn.show') : t('mn.hide')}</button>${i.custom ? `<button class="btn danger sm" data-del data-name="${esc(i.name)}">${ic('trash-2')} ${t('mn.del')}</button>` : ''}</div>`).join('')}`).join('')}</div>`;
  $('#addItem').onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    const r = await A('/api/admin/menu/items', { method: 'POST', body: JSON.stringify({ category: f.cat.value, name: f.name.value, name_kk: f.kk.value, name_en: f.en.value, variants: [{ label: f.size.value, price: Math.round(+f.price.value) }] }) });
    if (r.ok) loadMenu(); else $('#addErr').textContent = (await r.json().catch(() => ({}))).error || tp('mn.err');
  };
  document.querySelectorAll('#view-menu .mrow').forEach(row => {
    const id = row.dataset.id;
    const patch = async body => { await A('/api/admin/menu/items/' + id, { method: 'PATCH', body: JSON.stringify(body) }); loadMenu(); };
    row.querySelector('[data-save]').onclick = () => patch({ variants: [...row.querySelectorAll('input')].map(inp => inp.value === '' || +inp.value === +inp.dataset.base ? null : Math.round(+inp.value)) });
    row.querySelector('[data-reset]').onclick = () => patch({ variants: [...row.querySelectorAll('input')].map(() => null) });
    const del = row.querySelector('[data-del]');
    if (del) del.onclick = async () => { if (!confirm(tp('mn.delask', { n: del.dataset.name }))) return; await A('/api/admin/menu/items/' + id, { method: 'DELETE' }); loadMenu(); };
    row.querySelector('[data-hide]').onclick = e => patch({ hidden: e.currentTarget.dataset.hide === '1' });
  });
}

// ---------- система ----------
async function loadSys() {
  const [hr, ar] = await Promise.all([A('/api/admin/health'), A('/api/admin/audit?limit=40')]);
  if (hr.status === 401 || hr.status === 429) return logout();
  const h = await hr.json(), log = await ar.json();
  const up = h.uptimeSec >= 3600 ? Math.floor(h.uptimeSec / 3600) + ' h' : Math.floor(h.uptimeSec / 60) + ' min';
  $('#view-sys').innerHTML = `<div class="grid">
    <div class="card wide"><h2>${t('sy.title')}</h2>
      ${h.warnings.length ? h.warnings.map(w => `<div class="warnbox">${esc(tp('sy.w.' + w))}</div>`).join('') : `<div class="okbox">${t('sy.ok')}</div>`}
      <div class="list" style="margin-top:12px">
        <div class="r"><span>${t('sy.uptime')}</span><i>${up} · Node ${esc(h.node)}</i></div>
        <div class="r"><span>${t('sy.db')}</span><i>${num(h.dbSizeKb)} KB</i></div>
        <div class="r"><span>${t('sy.orders')}</span><i>${num(h.orders)}</i></div>
        <div class="r"><span>${t('sy.customers')}</span><i>${num(h.customers)}</i></div>
        <div class="r"><span>${t('sy.backup')}</span><i>${h.lastBackup ? dt(h.lastBackup) : t('sy.never')}</i></div>
      </div>
      <p style="margin-top:14px"><button class="btn" id="bk">${t('sy.download')}</button></p></div>
    <div class="card wide"><h2>${t('sy.audit')}</h2>${log.length ? log.map(l => `<div class="logrow"><b>${dt(l.at)}</b><span>${esc(l.actor)}</span>${esc(l.action)} ${esc(l.detail)}</div>`).join('') : `<p class="empty">${t('sy.audit.none')}</p>`}</div></div>`;
  $('#bk').onclick = async () => {
    const r = await A('/api/admin/backup');
    const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = 'drinkstar-backup.db'; document.body.appendChild(a); a.click(); a.remove();
  };
}

// ---------- вход ----------
function logout() { if (token) fetch('/api/admin/logout', { method: 'POST', headers: H() }).catch(() => {}); sessionStorage.removeItem('ds_atoken'); token = ''; $('#app').hidden = true; $('#login').hidden = false; }
async function start() {
  const [locs, menu] = await Promise.all([fetch('/api/locations').then(r => r.json()), fetch('/api/menu').then(r => r.json())]);
  locs.forEach(l => LOCS[l.id] = l);
  menu.categories.forEach(c => c.items.forEach(i => ITEMS[i.id] = i));
  $('#loc').innerHTML = `<option value="">${tp('ad.allloc')}</option>` + locs.map(l => `<option value="${l.id}">${esc(tr(l, 'address'))}</option>`).join('');
  $('#login').hidden = true; $('#app').hidden = false;
  show(view);
}
$('#days').onchange = $('#loc').onchange = load;
$('#out').onclick = logout;
$('#csv').onclick = async e => {
  e.preventDefault();
  const r = await A('/api/admin/orders.csv?days=' + $('#days').value);
  if (!r.ok) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = 'drinkstar-orders.csv'; document.body.appendChild(a); a.click(); a.remove();
};
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: $('#pin').value }) });
  if (r.ok) { token = (await r.json()).token; sessionStorage.setItem('ds_atoken', token); start(); }
  else { $('#loginErr').textContent = r.status === 429 ? tp('ad.toomany') : tp('st.badpin'); $('#pin').value = ''; }
};
if (token) A('/api/admin/stats?days=1').then(r => r.ok ? start() : logout());
