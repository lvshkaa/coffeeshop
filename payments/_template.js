/*
 * ШАБЛОН НАСТОЯЩЕГО ПЛАТЁЖНОГО ПРОВАЙДЕРА (Kaspi Pay, Halyk epay, Freedom Pay, CloudPayments...)
 *
 * Как подключить:
 *   1. Скопируйте файл:  payments/_template.js  ->  payments/kaspi.js  (или halyk.js, freedom.js)
 *   2. Заполните две функции ниже по документации провайдера.
 *   3. Положите ключи в переменные окружения (НЕ в код), например KASPI_MERCHANT_ID, KASPI_SECRET.
 *   4. Запустите с PAYMENT_PROVIDER=kaspi
 *   5. В кабинете провайдера укажите адрес уведомлений:  https://ВАШ-САЙТ/api/payments/webhook
 *   6. Проверьте тестовым платежом из тестового режима провайдера.
 *
 * Остальное (статусы заказа, экран персонала, страница клиента, отмена неоплаченных)
 * уже работает и менять не нужно.
 */
module.exports = {
  name: 'template',
  label: 'Онлайн-оплата',

  /**
   * Создать платёж и вернуть ссылку, куда отправить клиента.
   * @param order   { token, number, total, name, phone, items[] }  total в тенге
   * @param ctx     { baseUrl }  адрес сайта, например https://drinkstar.kz
   * @returns       { url, externalId }
   * Страница возврата после оплаты:  `${ctx.baseUrl}/track.html?t=${order.token}`
   */
  async createPayment(order, ctx) {
    throw new Error('Не реализовано: заполните createPayment по документации провайдера');
  },

  /**
   * Обработать уведомление от провайдера о результате платежа.
   * ОБЯЗАТЕЛЬНО проверьте подпись запроса секретным ключом, иначе любой сможет «оплатить» заказ.
   * @param req      http.IncomingMessage (заголовки, подпись)
   * @param rawBody  тело запроса строкой (для проверки подписи)
   * @returns        { token, paid: true|false }   token = order.token, который вы передали провайдеру
   * При неверной подписи бросайте ошибку.
   */
  async handleWebhook(req, rawBody) {
    throw new Error('Не реализовано: заполните handleWebhook по документации провайдера');
  }
};
