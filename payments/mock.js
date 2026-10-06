// Демо-провайдер: показывает путь оплаты без реальных денег. Для показа клиенту.
// Включён по умолчанию (PAYMENT_PROVIDER=mock). В боевом режиме замените на настоящего.
module.exports = {
  name: 'mock',
  label: 'Онлайн (демо)',

  // Возвращает ссылку, на которую отправляем клиента для оплаты.
  async createPayment(order, { baseUrl }) {
    return { url: `${baseUrl}/pay-mock.html?t=${order.token}`, externalId: 'mock-' + order.token };
  },

  // Демо не получает уведомлений от банка: оплату подтверждает страница pay-mock.html.
  async handleWebhook() {
    throw new Error('mock provider has no webhook');
  }
};
