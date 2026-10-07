const { LANG } = window.I18N;
const tk = new URLSearchParams(location.search).get('t');
const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
fetch('/api/orders/' + tk, { headers: { 'x-lang': LANG } }).then(r => r.json()).then(o => {
  if (o.error) throw 0;
  document.getElementById('sum').textContent = fmt(o.payable);
  document.getElementById('where').textContent = t('pm.order', { n: o.number, loc: o.location });
  if (o.paid) location.replace('/track.html?t=' + tk);
}).catch(() => { document.getElementById('err').textContent = t('pm.nf'); document.getElementById('btn').disabled = true; });
document.getElementById('f').onsubmit = async e => {
  e.preventDefault();
  const b = document.getElementById('btn'); b.disabled = true; b.textContent = t('pm.processing');
  await new Promise(r => setTimeout(r, 1200));
  const r = await fetch('/api/mock-pay/' + tk, { method: 'POST', headers: { 'x-lang': LANG } });
  if (r.ok) location.href = '/track.html?t=' + tk;
  else { document.getElementById('err').textContent = t('pm.fail'); b.disabled = false; b.textContent = t('pm.pay'); }
};
