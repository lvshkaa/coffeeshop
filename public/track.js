const { LANG, LOCALE } = window.I18N;
const token = new URLSearchParams(location.search).get('t');
const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STEPS = ['new', 'preparing', 'ready', 'done'];
let prev, timer, MENU_ITEMS = {}, ADDONS = {};
const out = document.getElementById('out');
const sndOn = () => { try { return localStorage.getItem('ds_csnd') !== 'off'; } catch { return true; } };
let repeatTimer = null, pickedRating = 0, tokenGlobal = token;

// когда заказ готов: сигнал, голос, вибрация; сигнал повторяется до трёх раз, пока клиент не коснётся экрана
// Для языков из CLIP_LANGS есть записанная фраза (public/audio/ready-<язык>.mp3). Для остальных: сигнал и голос браузера.
const CLIP_LANGS = ['ru'];
if (CLIP_LANGS.includes(LANG)) DSSound.preload('ready-' + LANG, '/audio/ready-' + LANG + '.mp3');
function playReady(o) {
  if (CLIP_LANGS.includes(LANG) && DSSound.playClip('ready-' + LANG)) return;
  DSSound.play('ready');
  setTimeout(() => DSSound.speak(tp('snd.readyself', { n: o.number }), LANG), 1300);
}
function announceReady(o) {
  if (!sndOn()) return;
  playReady(o);
  let n = 0;
  clearInterval(repeatTimer);
  repeatTimer = setInterval(() => { if (++n > 3) return clearInterval(repeatTimer); playReady(o); }, 20000);
  const stop = () => { clearInterval(repeatTimer); document.removeEventListener('pointerdown', stop); };
  document.addEventListener('pointerdown', stop);
}

function wireExtras(o) {
  const b = document.getElementById('sndBtn');
  if (b) b.onclick = async () => {
    const wasRunning = DSSound.running();
    await DSSound.unlock();
    // звук включён, но браузер ещё не разрешил его: первое касание только «будит» звук
    if (sndOn() && !wasRunning) { if (!(CLIP_LANGS.includes(LANG) && DSSound.playClip('ready-' + LANG))) DSSound.play('ok'); render(o); return; }
    try { localStorage.setItem('ds_csnd', sndOn() ? 'off' : 'on'); } catch { /* ignore */ }
    if (sndOn() && !(CLIP_LANGS.includes(LANG) && DSSound.playClip('ready-' + LANG))) DSSound.play('ok');
    render(o);
  };
  const form = document.getElementById('rvForm');
  if (form) {
    const paint = () => form.querySelectorAll('.rate button').forEach(x => { x.innerHTML = ic('star', +x.dataset.v <= pickedRating ? '' : 'ic-off'); });
    paint();
    form.querySelectorAll('.rate button').forEach(x => x.onclick = () => { pickedRating = +x.dataset.v; paint(); });
    form.onsubmit = async e => {
      e.preventDefault();
      const err = form.querySelector('.err');
      if (!pickedRating) { err.textContent = tp('rv.pickrating'); return; }
      const btn = form.querySelector('.send'); btn.disabled = true;
      try {
        const r = await fetch('/api/orders/' + tokenGlobal + '/review', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lang': LANG }, body: JSON.stringify({ rating: pickedRating, text: form.text.value }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'Error');
        load();
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
    };
  }
}

let lastOrder = null;
function render(o) {
  lastOrder = o;
  const idx = STEPS.indexOf(o.status);
  const steps = STEPS.map((s, i) => `<div class="step ${i < idx || o.status === 'done' ? 'done' : i === idx ? 'now' : ''}"><div class="dot">${i < idx || o.status === 'done' ? ic('check') : i + 1}</div>${t('tr.s' + (i + 1))}</div>`).join('');
  const lines = o.items.map(i => {
    const name = MENU_ITEMS[i.id] ? tr(MENU_ITEMS[i.id], 'name') : i.name;
    const adds = (i.addonIds || []).map(id => ADDONS[id] ? tr(ADDONS[id], 'name') : id);
    return `<div class="row"><span>${i.qty} × ${esc(name)} ${esc(I18N.num(i.variant))}${adds.length ? `<small>${adds.map(esc).join(', ')}</small>` : ''}</span><span>${fmt(i.unit * i.qty)}</span></div>`;
  }).join('');
  const open = o.status !== 'cancelled' && o.status !== 'awaiting_payment';
  const live = ['new', 'preparing', 'ready'].includes(o.status);
  const needTap = sndOn() && !DSSound.running();
  const sndBlock = live ? `<button class="sndbtn ${sndOn() ? (needTap ? 'tap' : 'on') : ''}" id="sndBtn" type="button">${ic(sndOn() ? 'bell' : 'bell-off')} <span>${sndOn() ? (needTap ? t('tr.sound.tap') : t('tr.sound.on')) : t('tr.sound.off')}</span></button><div class="sndhint">${t('tr.sound.hint')}</div>` : '';
  let reviewBlock = '';
  if (o.status === 'done' && o.review) {
    reviewBlock = `<div class="review"><h3>${t('rv.yours')}</h3><div class="mine">${[1, 2, 3, 4, 5].map(i => ic('star', i <= o.review.rating ? '' : 'ic-off')).join('')}</div>${o.review.text ? `<blockquote>${esc(o.review.text)}</blockquote>` : ''}${o.review.reply ? `<div class="reply"><b>${t('rv.reply')}</b>${esc(o.review.reply)}</div>` : ''}<div class="thanks">${t('rv.thanks')}</div></div>`;
  } else if (o.status === 'done' && o.canReview) {
    reviewBlock = `<form class="review" id="rvForm"><h3>${t('rv.title')}</h3><div class="sub">${t('rv.sub')}</div><div class="rate">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" aria-label="${i}"></button>`).join('')}</div><textarea name="text" maxlength="500" placeholder="${esc(tp('rv.placeholder'))}"></textarea><div class="note">${t('rv.nameNote')}</div><button class="send" type="submit">${t('rv.send')}</button><div class="err"></div></form>`;
  }
  out.innerHTML = `
    <div class="eyebrow">${t('tr.order')}</div><div class="num">№${o.number}</div><div class="where">${esc(o.location || '')}</div>
    <div class="status">${t('tr.t.' + o.status)}</div><div class="hint">${t('tr.h.' + o.status)}</div>
    ${open ? `<div class="steps">${steps}</div>` : ''}
    ${o.status === 'awaiting_payment' && o.payUrl ? `<a class="paybtn" href="${esc(o.payUrl)}">${t('tr.pay', { sum: fmt(o.payable) })}</a>` : ''}
    ${o.paid ? `<div class="paidtag">${t('tr.paidonline')}</div>` : (open && o.status !== 'done' ? `<div class="paidtag cash">${t('tr.paycash')}</div>` : '')}
    ${o.status === 'ready' ? `<div class="ready">${t('tr.say', { n: o.number })}</div>` : ''}
    ${sndBlock}
    <div class="list">${lines}
      ${o.bonusUsed ? `<div class="row"><span>${t('cart.sum')}</span><span>${fmt(o.total)}</span></div><div class="row" style="color:#40691f"><span>${t('tr.bonuspaid')}</span><span>−${fmt(o.bonusUsed)}</span></div>` : ''}
      <div class="row sum"><span>${o.bonusUsed ? t('cart.topay') : t('cart.total')}</span><span>${fmt(o.payable)}</span></div>
      ${o.cashbackDone ? `<div class="bonus-tag">${t('tr.bonusdone')}</div>` : (o.member && o.cashback ? `<div class="bonus-tag">${t('tr.bonussoon', { n: o.cashback })}</div>` : '')}
    </div>
    ${reviewBlock}
    <a class="back" href="/">${t('tr.home')}</a>`;
  wireExtras(o);
  if (prev && prev !== 'ready' && o.status === 'ready') { navigator.vibrate?.([200, 100, 200]); document.title = tp('tr.ready.title'); announceReady(o); }
  prev = o.status;
  if (o.status === 'done' || o.status === 'cancelled') clearInterval(timer);
}
async function load() {
  try {
    const r = await fetch('/api/orders/' + token, { headers: { 'x-lang': LANG } });
    if (!r.ok) throw 0;
    render(await r.json());
  } catch { out.innerHTML = `${t('tr.notfound')}<br><a class="back" href="/">${t('tr.home')}</a>`; clearInterval(timer); }
}
(async function start() {
  if (!token) { out.innerHTML = `${t('tr.nonumber')}<br><a class="back" href="/">${t('tr.home')}</a>`; return; }
  try {
    const m = await fetch('/api/menu').then(r => r.json());
    m.categories.forEach(c => c.items.forEach(i => MENU_ITEMS[i.id] = i));
    m.addons.forEach(a => ADDONS[a.id] = a);
  } catch { /* покажем названия, сохранённые в заказе */ }
  load(); timer = setInterval(load, 4000);
})();
