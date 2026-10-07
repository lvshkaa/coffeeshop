const $ = s => document.querySelector(s);
const { LANG, LOCALE } = window.I18N;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } } };

let token = sessionStorage.getItem('ds_stoken') || '';
let MENU_CATS = [];
let ME = null, orders = [], timer, LOCS = {}, ITEMS = {}, ADDONS = {}, seen = null, lastRemind = 0, pollN = 0;
let sound = store.get('ds_snd', 'on') !== 'off';
let voice = store.get('ds_voice', 'on') !== 'off';

const api = (url, opt = {}) => fetch(url, { ...opt, headers: { 'Content-Type': 'application/json', 'x-staff-token': token } });

// ---------- звук ----------
function setSndLabels() {
  $('#snd').classList.toggle('off', !sound); $('#snd').innerHTML = t(sound ? 'st.sound' : 'st.mute');
  $('#voice').classList.toggle('off', !voice); $('#voice').innerHTML = t(voice ? 'st.voiceon' : 'st.voiceoff');
}
function notifyNew(list) {
  if (sound) DSSound.play('new');
  if (voice) setTimeout(() => DSSound.speak(tp('snd.new', { n: list.map(o => o.number).join(', ') }), LANG), 1400);
}
// напоминание: заказ ждёт больше 45 секунд, сигнал каждые 30 секунд
setInterval(() => {
  const stale = orders.some(o => o.status === 'new' && Date.now() - o.createdAt > 45000);
  if (stale && sound && Date.now() - lastRemind > 30000) { DSSound.play('reminder'); lastRemind = Date.now(); }
  $('#audioBanner').hidden = !(sound && !$('#app').hidden && !DSSound.running());
}, 2000);
$('#snd').onclick = () => { sound = !sound; store.set('ds_snd', sound ? 'on' : 'off'); setSndLabels(); if (sound) DSSound.play('ok'); };
$('#voice').onclick = () => { voice = !voice; store.set('ds_voice', voice ? 'on' : 'off'); setSndLabels(); if (voice) DSSound.speak(tp('snd.new', { n: 1 }), LANG); };
$('#audioBanner').onclick = async () => { await DSSound.unlock(); DSSound.play('ok'); };

// ---------- данные ----------
async function poll() {
  try {
    const r = await api('/api/staff/orders');
    if (r.status === 401) return logout(true);
    orders = await r.json();
    setLive(true);
    const fresh = orders.filter(o => o.status === 'new' && seen && !seen.has(o.token));
    seen = new Set(orders.map(o => o.token));
    if (fresh.length) notifyNew(fresh);
    render();
    if (pollN++ % 4 === 0) refreshMe();
  } catch { setLive(false); }
}
async function refreshMe() {
  try { const r = await api('/api/staff/me'); if (r.ok) { ME = await r.json(); renderMe(); } } catch { /* ignore */ }
}
function setLive(ok) { const l = $('#live'); l.textContent = t(ok ? 'st.online' : 'st.offline'); l.classList.toggle('err', !ok); }
function renderMe() {
  if (!ME) return;
  $('#meName').textContent = ME.name;
  $('#meRole').textContent = t('st.role.' + ME.role);
  const place = ME.locationId === 'all' ? t('sf.allloc') : (LOCS[ME.locationId] ? tr(LOCS[ME.locationId], 'address') : '');
  const since = new Date(ME.startedAt).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' });
  $('#meSub').textContent = place + ' · ' + tp('st.shiftsince', { t: since }) + ' · ' + tp('st.handled', { n: ME.handled });
}

function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  return { text: m < 1 ? t('st.now') : t('st.min', { n: m }), late: m >= 8 };
}
const itemName = i => (ITEMS[i.id] ? tr(ITEMS[i.id], 'name') : i.name);
const addonNames = i => (i.addonIds && i.addonIds.length ? i.addonIds.map(id => (ADDONS[id] ? tr(ADDONS[id], 'name') : id)) : i.addons);
const locName = o => (LOCS[o.locationId] ? tr(LOCS[o.locationId], 'address') : o.location);

function card(o) {
  const a = ago(o.createdAt);
  const items = o.items.map(i => { const ad = addonNames(i); return `<div class="li">${i.qty} × ${esc(itemName(i))} ${esc(I18N.num(i.variant))}${ad.length ? `<small>+ ${ad.map(esc).join(', ')}</small>` : ''}</div>`; }).join('');
  const by = (o.acceptedBy || o.readyBy) ? `<div class="by">${o.acceptedBy ? `<span>${ic('user')} ${tp('st.acceptedby', { name: esc(o.acceptedBy) })}</span>` : ''}${o.readyBy ? `<span>${ic('check')} ${tp('st.readyby', { name: esc(o.readyBy) })}</span>` : ''}</div>` : '';
  const showLoc = (ME && ME.locationId === 'all') ? `<br>${esc(locName(o))}` : '';
  return `<div class="ord ${o.status}">
    <div class="ord-top"><b>№${o.number}</b><span class="age ${a.late && o.status !== 'ready' ? 'late' : ''}">${a.text}</span></div>
    <div class="who">${o.member ? `<span class="club">${t('st.club')}</span> ` : ''}${esc(o.name)} · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${showLoc}</div>
    ${items}
    ${o.bonusUsed ? `<div class="pay bonus">${t('st.bonuspaid', { n: money(o.bonusUsed) })}</div>` : ''}
    ${o.comment ? `<div class="cm">${ic('message-circle')} ${esc(o.comment)}</div>` : ''}
    ${o.paid ? `<div class="pay ok">${t('st.paidonline')}</div>` : `<div class="pay due">${t('st.takecash', { n: money(o.payable) })}</div>`}
    ${by}
    <div class="acts"><button class="${o.status === 'preparing' ? 'ok' : ''}" data-t="${o.token}" data-s="${{ new: 'preparing', preparing: 'ready', ready: 'done' }[o.status]}">${tp('st.act.' + o.status)}</button>
    <button class="sec" data-t="${o.token}" data-s="cancelled" title="${esc(tp('st.cancel'))}" aria-label="${esc(tp('st.cancel'))}">${ic('x')}</button></div></div>`;
}

function render() {
  const filter = $('#loc').hidden ? '' : $('#loc').value;
  const list = orders.filter(o => !filter || filter === 'all' || o.locationId === filter).sort((a, b) => a.createdAt - b.createdAt);
  ['new', 'preparing', 'ready'].forEach(s => {
    const col = list.filter(o => o.status === s);
    $('#c-' + s).textContent = col.length;
    $('#col-' + s).innerHTML = col.map(card).join('') || `<div class="empty">${t('st.empty')}</div>`;
  });
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-t]');
  if (!b) return;
  if (b.dataset.s === 'cancelled' && !confirm(tp('st.confirmcancel'))) return;
  b.disabled = true;
  const r = await api('/api/staff/orders/' + b.dataset.t, { method: 'PATCH', body: JSON.stringify({ status: b.dataset.s }) });
  if (r.status === 401) return logout(true);
  poll();
});
$('#loc').onchange = render;

// ---------- вход и смена ----------
function showLogin(msg) { $('#app').hidden = true; $('#login').hidden = false; $('#loginErr').textContent = msg || ''; $('#pin').value = ''; }
async function logout(expired) {
  clearInterval(timer);
  if (!expired && token) { try { await api('/api/staff/logout', { method: 'POST' }); } catch { /* ignore */ } }
  token = ''; ME = null; seen = null; sessionStorage.removeItem('ds_stoken');
  showLogin(expired ? tp('st.sessionend') : '');
}
$('#out').onclick = () => logout(false);

async function loadRefs() {
  const [locs, menu] = await Promise.all([fetch('/api/locations').then(r => r.json()), fetch('/api/menu').then(r => r.json())]);
  locs.forEach(l => LOCS[l.id] = l);
  MENU_CATS = menu.categories;
  menu.categories.forEach(c => c.items.forEach(i => ITEMS[i.id] = i));
  menu.addons.forEach(a => ADDONS[a.id] = a);
  return locs;
}
async function enter() {
  const locs = await loadRefs();
  await refreshMe();
  if (!ME) return logout(true);
  if (ME.role === 'manager') {
    $('#loc').innerHTML = `<option value="all">${t('st.all')}</option>` + locs.map(l => `<option value="${l.id}">${esc(tr(l, 'address'))}</option>`).join('');
    $('#loc').value = ME.locationId === 'all' ? 'all' : ME.locationId;
    $('#loc').hidden = false;
  } else $('#loc').hidden = true;
  setSndLabels(); setLive(true);
  $('#login').hidden = true; $('#app').hidden = false;
  await poll(); timer = setInterval(poll, 4000);
}

$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  DSSound.unlock();
  const pin = $('#pin').value.trim(), locationId = $('#loginLoc').value;
  if (!locationId) { $('#loginErr').textContent = tp('st.chooseloc'); return; }
  const r = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, locationId }) });
  if (r.ok) { const d = await r.json(); token = d.token; sessionStorage.setItem('ds_stoken', token); DSSound.play('ok'); enter(); }
  else { $('#loginErr').textContent = r.status === 429 ? tp('st.toomany') : r.status === 400 ? tp('st.chooseloc') : tp('st.badpin'); $('#pin').value = ''; }
};

(async function init() {
  const locs = await fetch('/api/locations').then(r => r.json());
  $('#loginLoc').innerHTML = `<option value="">${tp('st.chooseloc')}</option>` + locs.map(l => `<option value="${l.id}">${esc(tr(l, 'address'))}</option>`).join('') + `<option value="all">${tp('st.manager.all')}</option>`;
  setSndLabels();
  if (token) enter();
})();

// ---------- стоп-лист ----------
async function openStop() {
  const loc = ME.locationId !== 'all' ? ME.locationId : ($('#loc').value && $('#loc').value !== 'all' ? $('#loc').value : '');
  $('#stopDlg').hidden = false;
  if (!loc) { $('#stopHint').textContent = tp('st.stop.pick'); $('#stopList').innerHTML = ''; return; }
  $('#stopHint').textContent = tp('st.stop.hint') + ' — ' + (LOCS[loc] ? tr(LOCS[loc], 'address') : loc);
  const r = await api('/api/staff/stoplist');
  const stop = new Set(((await r.json()).stop || {})[loc] || []);
  $('#stopList').innerHTML = MENU_CATS.flatMap(c => c.items).filter(i => i.variants.some(v => typeof v.price === 'number')).map(i =>
    `<div class="stoprow ${stop.has(i.id) ? 'off' : ''}"><span>${esc(tr(i, 'name'))}</span><button type="button" data-id="${i.id}" data-stopped="${stop.has(i.id) ? 0 : 1}">${stop.has(i.id) ? tp('menu.sold') : '✓'}</button></div>`).join('');
  $('#stopList').onclick = async e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    await api('/api/staff/stoplist', { method: 'POST', body: JSON.stringify({ itemId: b.dataset.id, stopped: b.dataset.stopped === '1', locationId: loc }) });
    openStop();
  };
}
$('#stopBtn').onclick = openStop;
$('#stopClose').onclick = () => { $('#stopDlg').hidden = true; };
