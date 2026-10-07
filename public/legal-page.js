const { LANG } = window.I18N;
const params = new URLSearchParams(location.search);
const kind = ['privacy', 'terms', 'club'].includes(params.get('doc')) ? params.get('doc') : 'privacy';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PH = {
  ru: { company: 'название ТОО/ИП', bin: 'БИН/ИИН', address: 'адрес', phone: 'телефон', email: 'e-mail', storage: 'место хранения: сервер на территории РК' },
  kk: { company: 'ЖШС/ЖК атауы', bin: 'БСН/ЖСН', address: 'мекенжай', phone: 'телефон', email: 'e-mail', storage: 'сақтау орны: ҚР аумағындағы сервер' },
  en: { company: 'company name', bin: 'BIN', address: 'address', phone: 'phone', email: 'e-mail', storage: 'storage location: server in Kazakhstan' }
}[LANG];
const DRAFT = {
  ru: 'Шаблон документа. Перед запуском его должен проверить юрист. Заполните данные организации в data/company.json, затем поставьте "draft": false, и это сообщение исчезнет.',
  kk: 'Құжат үлгісі. Іске қосар алдында заңгер тексеруі тиіс. Ұйым деректерін data/company.json файлына толтырып, "draft": false қойыңыз, бұл хабарлама жоғалады.',
  en: 'Document template. A lawyer must review it before launch. Fill in the organisation details in data/company.json, then set "draft": false and this notice will disappear.'
}[LANG];
const NAV = { privacy: { ru: 'Политика конфиденциальности', kk: 'Құпиялылық саясаты', en: 'Privacy Policy' }, terms: { ru: 'Публичная оферта', kk: 'Жария оферта', en: 'Public Offer' }, club: { ru: 'Правила клуба', kk: 'Клуб ережелері', en: 'Club Rules' } };
const VERSION = { ru: 'Версия от', kk: 'Нұсқа', en: 'Version of' }[LANG];

fetch('/api/config').then(r => r.json()).then(cfg => {
  const co = cfg.company || {};
  const vals = { company: co.name, bin: co.bin, address: co.address, phone: co.phone, email: co.email, storage: co.storage, version: co.legalVersion, p: cfg.club.cashbackPercent, m: cfg.club.maxBonusPercent };
  const fill = str => esc(str).replace(/\{(\w+)\}/g, (m, k) => (vals[k] !== undefined && vals[k] !== '' && vals[k] !== null) ? esc(vals[k]) : (PH[k] ? `<mark class="ph">[${esc(PH[k])}]</mark>` : m));
  const d = LEGAL[kind][LANG];
  document.title = d.title + ' — DrinkStar';
  document.getElementById('doc').innerHTML =
    (co.draft ? `<div class="draft">${esc(DRAFT)}</div>` : '') +
    `<h1>${esc(d.title)}</h1><div class="ver">${VERSION} ${esc(co.legalVersion || '')}</div>` +
    d.sections.map(([h, ps], i) => `<h2>${i + 1}. ${esc(h)}</h2>${ps.map(p => `<p>${fill(p)}</p>`).join('')}`).join('') +
    `<div class="nav">${['privacy', 'terms', 'club'].map(k => `<a class="${k === kind ? 'cur' : ''}" href="legal.html?doc=${k}">${NAV[k][LANG]}</a>`).join('')}<a href="/">← DrinkStar</a></div>`;
});
