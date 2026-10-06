// Демо-SMS: код не отправляется, а показывается на странице и пишется в консоль сервера.
// Для показа клиенту. Перед боевым запуском замените на настоящего провайдера (см. _template.js).
module.exports = {
  name: 'demo',
  demo: true,
  async send(phone, code) {
    console.log(`[SMS демо] +${phone}: код ${code}`);
  }
};
