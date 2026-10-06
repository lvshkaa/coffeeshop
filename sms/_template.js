/*
 * ШАБЛОН НАСТОЯЩЕГО SMS-ПРОВАЙДЕРА (Mobizon, SMSC.kz, Twilio и т.п.)
 *
 *   1. Скопируйте файл:  sms/_template.js  ->  sms/mobizon.js  (имя по провайдеру)
 *   2. Заполните send() по документации провайдера. Ключи берите из process.env, не из кода.
 *   3. Запустите с SMS_PROVIDER=mobizon
 *
 * Вызывается сервером при запросе кода входа в клуб.
 */
module.exports = {
  name: 'template',
  demo: false, // у настоящего провайдера код НЕ показывается на странице

  /**
   * @param phone  номер в формате 7XXXXXXXXXX (без +)
   * @param code   код из 4 цифр
   * Бросайте ошибку, если провайдер отказал: пользователь увидит «не удалось отправить SMS».
   */
  async send(phone, code) {
    const text = `DrinkStar: ваш код ${code}. Никому его не сообщайте.`;
    throw new Error('Не реализовано: отправьте SMS «' + text + '» на +' + phone + ' через API провайдера');
  }
};
