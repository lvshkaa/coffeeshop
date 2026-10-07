// Точка входа: сначала при необходимости восстанавливаем данные из внешней копии, потом запускаем приложение.
const path = require('path');
const { restoreIfEmpty } = require('./lib/offsite');

(async () => {
  try { await restoreIfEmpty(process.env.DATA_DIR || path.join(__dirname, 'data')); }
  catch (e) { console.error('restore:', e.message); }
  require('./app');
})();
