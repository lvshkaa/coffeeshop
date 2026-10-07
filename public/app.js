const $ = s => document.querySelector(s);
const { LANG, LOCALE, num: numLabel } = window.I18N;
const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
const fmtB = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим */ } }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const api = (url, body, method) => fetch(url, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', 'x-lang': LANG }, body: body ? JSON.stringify(body) : undefined })
  .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Error'); return d; });
const date = ts => new Date(ts).toLocaleDateString(LOCALE);

let MENU, LOCS, CONFIG = { onlinePayment: false, club: { cashbackPercent: 5, maxBonusPercent: 50, freeSyrup: true, syrupAddonId: 'syrup' } }, ITEMS = {};
let ME = null; // { customer, orders, history } или null для гостя
let cart = store.get('ds_cart', []);
let form = store.get('ds_form', { name: '', phone: '', locationId: '', comment: '', payment: 'online', useBonus: false, agree: false });

// --- время ---
function astanaMinutes() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Almaty', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value;
}
const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
const isOpen = l => { const n = astanaMinutes(); return n >= toMin(l.open) && n < toMin(l.close); };
const locName = l => tr(l, 'address') + (tr(l, 'sub') ? ' (' + tr(l, 'sub') + ')' : '');

// --- цены: участникам клуба сироп бесплатно ---
const member = () => !!ME?.customer;
const addonPrice = a => (member() && CONFIG.club.freeSyrup && a.id === CONFIG.club.syrupAddonId ? 0 : a.price);
const lineUnit = l => ITEMS[l.id].variants[l.v].price + l.addons.reduce((s, id) => s + addonPrice(MENU.addons.find(a => a.id === id)), 0);
const cartTotal = () => cart.reduce((s, l) => s + lineUnit(l) * l.qty, 0);
const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
const maxBonus = () => member() ? Math.max(0, Math.min(ME.customer.bonus, Math.floor(cartTotal() * CONFIG.club.maxBonusPercent / 100))) : 0;
function saveCart() { store.set('ds_cart', cart); renderCartBtn(); }
function renderCartBtn() { $('#cartCount').textContent = cartCount(); }

function addToCart(id, v) {
  const line = cart.find(l => l.id === id && l.v === v && !l.addons.length);
  if (line) line.qty++; else cart.push({ id, v, qty: 1, addons: [] });
  saveCart();
  const b = $('#cartBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  toast(t('cart.added', { name: tr(ITEMS[id], 'name') }));
}
let toastT;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600);
}

// --- меню ---
function buyButtons(it) {
  return it.variants.map((v, i) => v.price == null ? `<span class="soon">${t('menu.soon')}</span>` :
    `<button class="add" data-id="${it.id}" data-v="${i}">${v.label && it.variants.length > 1 ? `<small>${numLabel(v.label)}</small>` : ''}${fmt(v.price)}<i>+</i></button>`).join('');
}
function showTab(id) {
  const c = MENU.categories.find(x => x.id === id);
  $('#panel').innerHTML = (c.note ? `<div class="menu-note">${esc(tr(c, 'note'))}</div>` : '') + c.items.map(i =>
    `<div class="item"><div class="name">${esc(tr(i, 'name'))}${i.star ? ' <span class="star">' + ic('star') + '</span>' : ''}${tr(i, 'desc') ? `<small>${esc(tr(i, 'desc'))}</small>` : ''}</div><div class="dots"></div><div class="buy">${buyButtons(i)}</div></div>`).join('');
  [...$('#tabs').children].forEach(b => b.classList.toggle('active', b.dataset.id === id));
}
// фото напитка: либо отдельный файл (photo.src), либо кадр из общей картинки (photo.pos + photo.size)
function drinkPhoto(i) {
  const p = i.photo; if (!p) return '';
  const crop = p.size ? `background-size:${p.size} auto;background-position:${p.pos}` : 'background-size:cover;background-position:center';
  return `<div class="drink-ph" role="img" aria-label="${esc(tr(i, 'name'))}" style="background-image:url(${p.src});${crop}"></div>`;
}
function renderMenu() {
  const cats = MENU.categories.filter(c => c.id !== 'fall');
  $('#tabs').innerHTML = cats.map(c => `<button class="tab" data-id="${c.id}">${esc(tr(c, 'name'))}</button>`).join('');
  $('#tabs').onclick = e => { const b = e.target.closest('.tab'); if (b) showTab(b.dataset.id); };
  showTab(cats[0].id);
  const fall = MENU.categories.find(c => c.id === 'fall');
  $('#fallGrid').innerHTML = fall.items.map(i =>
    `<div class="fall-card">${drinkPhoto(i)}<h3>${esc(tr(i, 'name'))}${i.star ? ' ' + ic('star') : ''}</h3><p>${esc(tr(i, 'desc'))}</p><div class="buy" style="justify-content:flex-start">${buyButtons(i)}</div></div>`).join('');
  $('#addonList').innerHTML = MENU.addons.map(a => `<li><span>${esc(tr(a, 'name'))}</span><b>+${a.price} ₸</b></li>`).join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('.add');
  if (b) addToCart(b.dataset.id, +b.dataset.v);
  if (e.target.closest('[data-open-club]')) { e.preventDefault(); openClub(); }
});

// --- адреса ---
function renderLocs() {
  $('#locs').innerHTML = LOCS.map(l => {
    const open = isOpen(l);
    const q = encodeURIComponent('DrinkStar ' + l.address + ' Астана');
    return `<div class="loc"><div><h3>${esc(tr(l, 'address'))}</h3>${tr(l, 'sub') ? `<div class="sub">${esc(tr(l, 'sub'))}</div>` : ''}<div class="hrs">${l.open} – ${l.close}</div></div>
    <div class="loc-end"><span class="badge ${open ? 'open' : 'closed'}">${open ? t('places.open') : t('places.closed')}</span>
    <a href="https://2gis.kz/astana/search/${q}" target="_blank" rel="noopener">${t('places.route')}</a></div></div>`;
  }).join('');
}

// --- отзывы ---
const starsHtml = n => Array.from({ length: 5 }, (_, i) => ic('star', i < n ? '' : 'ic-off')).join('');
let rvShown = 0;
async function loadReviews(reset) {
  if (reset) rvShown = 0;
  let d;
  try { d = await api('/api/reviews?limit=6&offset=' + rvShown); } catch { return; }
  if (reset) {
    const max = Math.max(1, ...d.stars);
    $('#rvSummary').innerHTML = d.count
      ? `<div class="rv-avg"><b>${d.avg.toFixed(1)}</b><div class="rv-stars">${starsHtml(Math.round(d.avg))}</div><small>${t('rv.count', { n: d.count })}</small></div>
         <div class="rv-bars">${[5, 4, 3, 2, 1].map(s => `<div class="rv-bar"><span>${s}</span><div><i style="width:${d.stars[s - 1] / max * 100}%"></i></div><em>${d.stars[s - 1]}</em></div>`).join('')}</div>`
      : `<p class="rv-empty">${t('rv.empty')}</p>`;
    $('#rvGrid').innerHTML = '';
  }
  $('#rvGrid').insertAdjacentHTML('beforeend', d.items.map(r => {
    const loc = LOCS && LOCS.find(l => l.id === r.locationId);
    return `<article class="rv-card"><div class="rv-head"><span class="rv-stars">${starsHtml(r.rating)}</span><small>${date(r.createdAt)}</small></div>
      ${r.text ? `<p>${esc(r.text)}</p>` : ''}
      <div class="rv-by"><b>${esc(r.name || '—')}</b>${loc ? ` · ${esc(tr(loc, 'address'))}` : ''}</div>
      ${r.reply ? `<div class="rv-reply"><b>${t('rv.replyby')}</b>${esc(r.reply)}</div>` : ''}</article>`;
  }).join(''));
  rvShown += d.items.length;
  $('#rvMore').innerHTML = rvShown < d.count ? `<button class="btn" id="rvMoreBtn">${t('rv.more')}</button>` : '';
  const mb = $('#rvMoreBtn'); if (mb) mb.onclick = () => loadReviews(false);
}

// --- панели ---
function closeAll() { document.querySelectorAll('.drawer').forEach(d => d.classList.remove('on')); $('#overlay').classList.remove('on'); }
function openDrawer(id) { closeAll(); $(id).classList.add('on'); $('#overlay').classList.add('on'); }
$('#overlay').onclick = closeAll;
addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
$('#cartBtn').onclick = openCart;
$('#closeCart').onclick = closeAll;

// ====== КЛУБ ======
function renderClubBtn() {
  const b = $('#clubBtn');
  b.innerHTML = member() ? `${ic('star')} <b>${fmtB(ME.customer.bonus)}</b>` : `<span class="long">${t('cl.btn')}</span><span class="short">${ic('star')} ${t('cl.short')}</span>`;
  b.classList.toggle('in', member());
}
async function refreshMe() {
  try { ME = (await api('/api/me')); if (!ME.customer) ME = null; } catch { ME = null; }
  if (member()) {
    form.phone = ME.customer.phone; if (!form.name) form.name = ME.customer.name;
  }
  renderClubBtn();
}
const phonePretty = p => p ? '+7 ' + p.slice(1, 4) + ' ' + p.slice(4, 7) + ' ' + p.slice(7, 9) + ' ' + p.slice(9) : '';
let club = { step: 'phone', phone: '', name: '', demoCode: '', err: '', busy: false, consent: false, marketing: false };

function openClub() {
  club = { ...club, step: member() ? 'account' : 'phone', err: '', busy: false };
  renderClub(); openDrawer('#clubDrawer');
  if (member()) refreshMe().then(renderClub);
}
function renderClub() {
  const body = $('#clubBody'), c = CONFIG.club;
  if (club.step === 'account' && member()) {
    const hist = ME.history.length ? ME.history.map(h => `<div class="row"><span>${t('r.' + h.reason)}<small>${date(h.created_at)}</small></span><b class="${h.delta > 0 ? 'plus' : 'minus'}">${h.delta > 0 ? '+' : ''}${fmtB(h.delta)}</b></div>`).join('') : `<div class="muted">${t('cl.nohistory')}</div>`;
    const ords = ME.orders.length ? ME.orders.map(o => `<a class="row link" href="/track.html?t=${o.token}"><span>№${o.number} · ${esc(o.location || '')}<small>${date(o.createdAt)} · ${t('s.' + o.status)}</small></span><b>${fmt(o.payable)}</b></a>`).join('') : `<div class="muted">${t('cl.noorders')}</div>`;
    body.innerHTML = `
      <div class="bal"><div class="muted">${t('cl.hello', { name: esc(ME.customer.name || t('cl.guestname')) })}</div><div class="bal-num">${fmtB(ME.customer.bonus)} <span>${t('cl.bonuses')}</span></div><div class="muted">${t('cl.rate')} · ${phonePretty(ME.customer.phone)}</div></div>
      <div class="perks"><div>${t('cl.perk1', { p: c.cashbackPercent })}</div>${c.freeSyrup ? `<div>${t('cl.perk2')}</div>` : ''}<div>${t('cl.perk3', { p: c.maxBonusPercent })}</div></div>
      <h4>${t('cl.orders')}</h4>${ords}<h4>${t('cl.history')}</h4>${hist}
      <button class="btn out" id="logout">${t('cl.logout')}</button>
      <button class="linkbtn danger" id="delData" type="button">${t('lg.delete')}</button>`;
    $('#delData').onclick = async () => { if (!confirm(t('lg.deleteconfirm'))) return; try { await api('/api/me/delete', {}); ME = null; form.phone = ''; form.name = ''; renderClubBtn(); closeAll(); toast(t('lg.deleted')); } catch (ex) { toast(ex.message); } };
    $('#logout').onclick = async () => { await api('/api/auth/logout', {}); ME = null; form.phone = ''; renderClubBtn(); closeAll(); toast(t('cl.loggedout')); };
    return;
  }
  const perks = `<div class="perks"><div>${t('cl.perk1s', { p: c.cashbackPercent })}</div>${c.freeSyrup ? `<div>${t('cl.perk2s')}</div>` : ''}<div>${t('cl.perk3s', { p: c.maxBonusPercent })}</div></div>`;
  if (club.step === 'phone') {
    body.innerHTML = `<p class="muted" style="margin:14px 0">${t('cl.intro')}</p>${perks}
      <form class="form" id="clubForm" novalidate>
        <label>${t('cl.yourname')}<input name="name" autocomplete="name" maxlength="60" value="${esc(club.name)}"></label>
        <label>${t('cart.phone')}<input name="phone" type="tel" autocomplete="tel" placeholder="+7 7__ ___ __ __" value="${esc(club.phone)}"></label>
        <label class="check"><input type="checkbox" name="consent" ${club.consent ? 'checked' : ''}><span>${t('lg.consent.club')}</span></label>
        <label class="check"><input type="checkbox" name="marketing" ${club.marketing ? 'checked' : ''}><span>${t('lg.marketing')}</span></label>
        <div class="err">${esc(club.err)}</div>
        <button class="btn fill submit" ${club.busy ? 'disabled' : ''}>${club.busy ? t('cart.sending') : t('cl.getcode')}</button>
      </form>`;
    $('#clubForm').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      club.name = f.name.value; club.phone = f.phone.value; club.consent = f.consent.checked; club.marketing = f.marketing.checked;
      if (!club.consent) { club.err = t('lg.needconsent'); renderClub(); return; }
      club.err = ''; club.busy = true; renderClub();
      try { const d = await api('/api/auth/request', { phone: club.phone, consent: true }); club.demoCode = d.demoCode || ''; club.step = 'code'; }
      catch (ex) { club.err = ex.message; }
      club.busy = false; renderClub();
    };
  } else {
    body.innerHTML = `<p class="muted" style="margin:14px 0">${t('cl.sentto', { phone: esc(club.phone) })}</p>
      ${club.demoCode ? `<div class="demo-code">${t('cl.demo')} <b>${club.demoCode}</b></div>` : ''}
      <form class="form" id="codeForm" novalidate>
        <label>${t('cl.code')}<input name="code" class="code" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="••••" autofocus></label>
        <div class="err">${esc(club.err)}</div>
        <button class="btn fill submit" ${club.busy ? 'disabled' : ''}>${club.busy ? t('cl.checking') : t('cl.enter')}</button>
        <button type="button" class="linkbtn" id="back">${t('cl.changephone')}</button>
      </form>`;
    $('#back').onclick = () => { club.step = 'phone'; club.err = ''; renderClub(); };
    $('#codeForm').onsubmit = async e => {
      e.preventDefault();
      const code = e.target.code.value;
      club.err = ''; club.busy = true; renderClub();
      try {
        await api('/api/auth/verify', { phone: club.phone, code, name: club.name, consent: true, marketing: club.marketing });
        await refreshMe(); club.step = 'account'; toast(t('cl.welcome'));
        renderCart();
      } catch (ex) { club.err = ex.message; }
      club.busy = false; renderClub();
    };
  }
}

// ====== КОРЗИНА ======
function openCart() { renderCart(); openDrawer('#drawer'); }
function renderCart() {
  const body = $('#cartBody');
  if (!cart.length) { body.innerHTML = `<div class="empty">${t('cart.empty')}</div>`; return; }
  const lines = cart.map((l, idx) => {
    const it = ITEMS[l.id], v = it.variants[l.v];
    const chips = MENU.addons.map(a => {
      const p = addonPrice(a);
      return `<button class="chip ${l.addons.includes(a.id) ? 'on' : ''}" data-idx="${idx}" data-addon="${a.id}">${esc(tr(a, 'name'))} ${p === 0 ? `<b>${t('cart.free')}</b>` : '+' + p}</button>`;
    }).join('');
    return `<div class="line"><div class="line-top"><span>${esc(tr(it, 'name'))} <small>${numLabel(v.label)}</small></span><span>${fmt(lineUnit(l) * l.qty)}</span></div>
      <div class="chips">${chips}</div>
      <div class="line-ctrl"><div class="qty"><button data-idx="${idx}" data-d="-1">−</button><b>${l.qty}</b><button data-idx="${idx}" data-d="1">+</button></div></div></div>`;
  }).join('');
  const opts = `<option value="">${t('cart.choose')}</option>` + LOCS.map(l =>
    `<option value="${l.id}" ${isOpen(l) ? '' : 'disabled'} ${form.locationId === l.id ? 'selected' : ''}>${esc(locName(l))} · ${isOpen(l) ? t('cart.until', { t: l.close }) : t('cart.closed')}</option>`).join('');

  const total = cartTotal(), mb = maxBonus();
  const useBonus = member() && form.useBonus && mb > 0;
  const bonusUsed = useBonus ? mb : 0, payable = total - bonusUsed;
  const cashback = member() ? Math.floor(payable * CONFIG.club.cashbackPercent / 100) : 0;
  const clubBox = member()
    ? `<div class="club-card"><div><b>${t('cc.member', { n: fmtB(ME.customer.bonus) })}</b><small>${t('cc.willreturn', { n: fmtB(cashback) })}</small></div>
       ${mb > 0 ? `<label class="switch"><input type="checkbox" id="useBonus" ${useBonus ? 'checked' : ''}><span>${t('cc.spend', { n: fmtB(mb) })}</span></label>` : `<small>${t('cc.keep')}</small>`}</div>`
    : `<div class="club-card guest"><div><b>${t('cc.guest')}</b><small>${t('cc.guesttext', { p: CONFIG.club.cashbackPercent })}</small></div><button class="btn sm" type="button" data-open-club>${t('cc.login')}</button></div>`;

  body.innerHTML = `${lines}${clubBox}
    <div class="sums">
      ${bonusUsed ? `<div class="srow"><span>${t('cart.sum')}</span><span>${fmt(total)}</span></div><div class="srow plus"><span>${t('cart.bonuses')}</span><span>−${fmt(bonusUsed)}</span></div>` : ''}
      <div class="total"><span>${bonusUsed ? t('cart.topay') : t('cart.total')}</span><span>${fmt(payable)}</span></div>
    </div>
    <form class="form" id="orderForm" novalidate>
      <label>${t('cart.where')}<select name="locationId">${opts}</select></label>
      <label>${t('cart.name')}<input name="name" autocomplete="name" value="${esc(form.name)}" maxlength="60"></label>
      <label>${t('cart.phone')}<input name="phone" type="tel" autocomplete="tel" placeholder="+7 7__ ___ __ __" value="${esc(member() ? phonePretty(ME.customer.phone) : form.phone)}" ${member() ? 'readonly' : ''}></label>
      <label>${t('cart.comment')}<textarea name="comment" maxlength="300" placeholder="${esc(t('cart.commentPh'))}">${esc(form.comment)}</textarea></label>
      ${CONFIG.onlinePayment && payable > 0 ? `<div class="pay-choice">
        <label class="radio"><input type="radio" name="payment" value="online" ${form.payment !== 'cash' ? 'checked' : ''}><span><b>${t('cart.online')}</b><small>${esc(CONFIG.paymentLabel)}</small></span></label>
        <label class="radio"><input type="radio" name="payment" value="cash" ${form.payment === 'cash' ? 'checked' : ''}><span><b>${t('cart.cash')}</b><small>${t('cart.cashsub')}</small></span></label>
      </div>` : ''}
      <div class="pay-note">${CONFIG.onlinePayment ? t('cart.pickup') : t('cart.pickupcash')}.</div>
      <label class="check"><input type="checkbox" name="agree" ${form.agree ? 'checked' : ''}><span>${t('lg.consent.order')}</span></label>
      <div class="err" id="err"></div>
      <button class="btn fill submit" id="submit" type="submit">${t('cart.submit', { sum: fmt(payable) })}</button>
    </form>`;
  $('#orderForm').oninput = e => { if (e.target.name && !e.target.readOnly) { form[e.target.name] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; store.set('ds_form', form); } };
  $('#orderForm').onsubmit = submitOrder;
  const ub = $('#useBonus'); if (ub) ub.onchange = () => { form.useBonus = ub.checked; store.set('ds_form', form); renderCart(); };
}
$('#cartBody').addEventListener('click', e => {
  const q = e.target.closest('[data-d]');
  const c = e.target.closest('[data-addon]');
  if (q) {
    const l = cart[+q.dataset.idx]; l.qty += +q.dataset.d;
    if (l.qty < 1) cart.splice(+q.dataset.idx, 1);
    saveCart(); renderCart();
  } else if (c) {
    const l = cart[+c.dataset.idx], a = c.dataset.addon;
    l.addons = l.addons.includes(a) ? l.addons.filter(x => x !== a) : [...l.addons, a];
    saveCart(); renderCart();
  }
});

async function submitOrder(e) {
  e.preventDefault();
  const btn = $('#submit'), err = $('#err'), label = btn.textContent;
  if (!form.agree) { err.textContent = t('lg.needconsent'); return; }
  err.textContent = ''; btn.disabled = true; btn.textContent = t('cart.sending');
  const payable = cartTotal() - (member() && form.useBonus ? maxBonus() : 0);
  const paying = CONFIG.onlinePayment && form.payment !== 'cash' && payable > 0;
  try {
    const d = await api('/api/orders', { ...form, payment: paying ? 'online' : 'cash', useBonus: member() && !!form.useBonus, consent: !!form.agree, items: cart });
    store.set('ds_last', d.token);
    cart = []; saveCart();
    location.href = d.payUrl || '/track.html?t=' + d.token;
  } catch (ex) {
    err.textContent = ex.message; btn.disabled = false; btn.textContent = label;
  }
}

// --- старт ---
(async function init() {
  const btn = document.createElement('button');
  btn.className = 'club-btn'; btn.id = 'clubBtn'; btn.onclick = openClub;
  $('.nav-actions').insertBefore(btn, $('#cartBtn'));
  const drawer = document.createElement('aside');
  drawer.className = 'drawer'; drawer.id = 'clubDrawer';
  drawer.innerHTML = `<div class="drawer-head"><h3>${ic('star')} DrinkStar Club</h3><button class="x" id="closeClub" aria-label="${esc(t('nav.close'))}">${ic('x')}</button></div><div class="drawer-body" id="clubBody"></div>`;
  document.body.appendChild(drawer);
  $('#closeClub').onclick = closeAll;
  renderClubBtn();

  const last = store.get('ds_last', null);
  if (last) { const a = $('#myorder'); a.href = '/track.html?t=' + last; a.hidden = false; }
  try {
    [MENU, LOCS, CONFIG] = await Promise.all([api('/api/menu'), api('/api/locations'), api('/api/config')]);
  } catch {
    $('#panel').innerHTML = `<div class="menu-note">${t('cart.menufail')}</div>`;
    return;
  }
  MENU.categories.forEach(c => c.items.forEach(i => ITEMS[i.id] = i));
  cart = cart.filter(l => ITEMS[l.id] && ITEMS[l.id].variants[l.v] && ITEMS[l.id].variants[l.v].price != null);
  const cc = CONFIG.club;
  document.querySelectorAll('[data-cashback]').forEach(el => el.textContent = cc.cashbackPercent);
  document.querySelectorAll('[data-maxbonus]').forEach(el => el.textContent = cc.maxBonusPercent);
  $('#clubBoxText').textContent = t('menu.clubtext', { p: cc.cashbackPercent });
  const co = CONFIG.company || {};
  const line = [co.name, co.bin && (t('lg.bin') + ' ' + co.bin), co.address, co.phone, co.email].filter(Boolean).join(' · ');
  $('#companyLine').textContent = line || (co.draft ? t('lg.companyph') : '');
  await refreshMe();
  renderMenu(); renderLocs(); renderCartBtn(); loadReviews(true);
})();

// --- шапка и появление блоков ---
const hdr = document.getElementById('hdr');
addEventListener('scroll', () => hdr.classList.toggle('solid', scrollY > 30), { passive: true });
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// фото галереи: подставляем, только если файл лежит в public/img/
document.querySelectorAll('.ph[data-img]').forEach(el => {
  const im = new Image();
  im.onload = () => el.style.setProperty('--img', 'url(' + el.dataset.img + ')');
  im.src = el.dataset.img;
});
