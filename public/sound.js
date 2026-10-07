// Звуки сайта: сигналы (WebAudio) и голосовые объявления (синтез речи браузера).
// Браузеры, особенно Safari на iPhone, разрешают звук только после касания экрана,
// поэтому звук «будится» при первом нажатии и дальше работает, пока страница открыта.
(function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;

  // возвращает промис: звук готов, когда браузер разрешил воспроизведение
  function unlock() {
    try {
      if (!AC) return Promise.resolve();
      ctx = ctx || new AC();
      if (ctx.state === 'suspended') return ctx.resume().catch(() => {});
    } catch { /* звук недоступен */ }
    return Promise.resolve();
  }
  ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev => document.addEventListener(ev, unlock, { passive: true }));

  // сигнал = список нот [частота Гц, начало с, длительность с]
  const SOUNDS = {
    new:      [[880, 0, .2], [1174, .2, .3], [880, .6, .2], [1174, .8, .45]],   // двойной «динь-дон»: новый заказ
    reminder: [[988, 0, .22], [784, .24, .4]],                                  // напоминание, если заказ не взяли
    ready:    [[659, 0, .18], [784, .18, .18], [988, .36, .18], [1318, .54, .6]], // восходящая мелодия: заказ готов
    ok:       [[784, 0, .12], [1046, .12, .22]]                                 // проверка звука
  };

  function play(kind) {
    unlock();
    if (!ctx || ctx.state !== 'running') return false;
    try {
      const t0 = ctx.currentTime + .02;
      for (const [freq, at, dur] of SOUNDS[kind] || SOUNDS.ok) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.0001, t0 + at);
        g.gain.exponentialRampToValueAtTime(.3, t0 + at + .02);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur);
        o.start(t0 + at); o.stop(t0 + at + dur + .05);
      }
      return true;
    } catch { return false; }
  }

  // голос: подбираем голос системы под язык; если для языка голоса нет (часто для казахского), молчим
  const LANG_TAG = { ru: 'ru', kk: 'kk', en: 'en' };
  function speak(text, lang) {
    try {
      if (!('speechSynthesis' in window) || !text) return false;
      const tag = LANG_TAG[lang] || 'ru';
      const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(tag));
      if (!voice && tag === 'kk') return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice ? voice.lang : tag; if (voice) u.voice = voice;
      u.rate = 1; u.volume = 1;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      return true;
    } catch { return false; }
  }
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch { /* ignore */ } }

  window.DSSound = { unlock, play, speak, running: () => !!ctx && ctx.state === 'running' };
})();
