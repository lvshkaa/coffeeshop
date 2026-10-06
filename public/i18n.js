// Языки сайта: ru, kk, en. Выбор запоминается; ?lang=kk в адресе тоже работает.
(function () {
  const LANGS = ['ru', 'kk', 'en'];
  const LABEL = { ru: 'RU', kk: 'KZ', en: 'EN' };
  const LOCALE = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-GB' };

  const DICT = {
    ru: {
      'title': 'DrinkStar Coffee&more — Pause the world',
      'nav.fall': 'Новинки', 'nav.menu': 'Меню', 'nav.vibe': 'Атмосфера', 'nav.places': 'Адреса', 'nav.club': 'Club',
      'nav.myorder': 'Мой заказ', 'nav.cart': 'Корзина', 'nav.close': 'Закрыть',
      'hero.eyebrow': 'DrinkStar Coffee&more · Астана',
      'hero.text': 'Мир подождёт. Сядьте поудобнее, вдохните аромат свежесваренного кофе и позвольте себе минуту тишины. Восемь уютных мест в Астане.',
      'hero.menu': 'Смотреть меню', 'hero.places': 'Адреса и часы',
      'hero.tag1': '100% арабика', 'hero.tag2': 'Свежеобжаренный', 'hero.tag3': 'Десерты и выпечка',
      'fall.eyebrow': 'Сезонная новинка', 'fall.lead': 'Три осенних вкуса, которые пахнут как плед и дождь за окном. 0,4 л — 1 590 ₸.',
      'menu.eyebrow': 'Меню', 'menu.title': 'Выберите своё настроение',
      'menu.lead': 'Кофе из 100% арабики, чай, лимонады и десерты. Нажмите на цену, чтобы добавить в заказ.',
      'menu.addons': 'Добавки', 'menu.soon': 'цена скоро',
      'menu.clubtext': 'Участникам клуба: сироп к любому напитку — 0 ₸ и {p}% бонусами с каждого заказа.', 'menu.clubbtn': 'Войти в клуб',
      'vibe.eyebrow': 'Атмосфера', 'vibe.title': 'Место, где можно остановиться',
      'vibe.lead': 'Тёплый свет, дерево, запах кофе. Для встреч, работы с ноутбуком и тихого утра.',
      'vibe.1': 'Утренний кофе', 'vibe.2': 'Вечер с друзьями', 'vibe.3': 'Работа за ноутбуком', 'vibe.4': 'Бариста за работой',
      'places.eyebrow': 'Адреса', 'places.title': '8 мест в Астане', 'places.lead': 'Статус «открыто» считается по астанинскому времени.',
      'places.2gis': 'Все точки в 2GIS ↗', 'places.open': 'Открыто', 'places.closed': 'Закрыто', 'places.route': 'Маршрут →',
      'club.eyebrow': 'DrinkStar Club', 'club.title': 'Кофе, который помнит вас',
      'club.lead': 'Входите по номеру телефона и получайте больше от каждого заказа. Заказывать можно и без входа, как гость.',
      'club.perk1': 'с каждого заказа возвращается бонусами', 'club.perk2': 'сироп к любому напитку бесплатно',
      'club.perk3': 'заказа можно оплатить накопленными бонусами', 'club.join': 'Вступить в клуб',
      'footer.copy': '© DrinkStar. Демо-версия сайта.',
      'cart.title': 'Ваш заказ', 'cart.empty': 'Корзина пуста.<br>Выберите что-нибудь вкусное в меню.', 'cart.added': '{name} добавлен',
      'cart.free': '★ бесплатно', 'cart.where': 'Где заберёте', 'cart.choose': 'Выберите кофейню', 'cart.until': 'до {t}', 'cart.closed': 'закрыто',
      'cart.name': 'Имя', 'cart.phone': 'Телефон', 'cart.comment': 'Комментарий', 'cart.commentPh': 'Например: без сахара',
      'cart.total': 'Итого', 'cart.topay': 'К оплате', 'cart.sum': 'Сумма', 'cart.bonuses': 'Бонусами',
      'cart.online': 'Оплатить онлайн', 'cart.cash': 'На кассе', 'cart.cashsub': 'при получении',
      'cart.pickup': 'Заказ на самовывоз', 'cart.pickupcash': 'Заказ на самовывоз. Оплата на кассе при получении',
      'cart.submit': 'Оформить заказ · {sum}', 'cart.sending': 'Отправляем…', 'cart.menufail': 'Не удалось загрузить меню. Запустите сервер: npm start',
      'cc.member': '★ Клуб · {n} бонусов', 'cc.willreturn': '+{n} бонусов вернётся после получения заказа', 'cc.keep': 'Копите бонусы с каждого заказа',
      'cc.spend': 'Списать {n}', 'cc.guest': '★ Участникам клуба', 'cc.guesttext': '{p}% бонусами с заказа и сироп бесплатно. Вы заказываете как гость.', 'cc.login': 'Войти',
      'cl.btn': '★ Войти в клуб', 'cl.short': 'Клуб', 'cl.hello': 'Привет, {name}!', 'cl.guestname': 'гость клуба', 'cl.bonuses': 'бонусов', 'cl.rate': '1 бонус = 1 ₸',
      'cl.perk1': '★ {p}% с каждого заказа возвращается бонусами', 'cl.perk2': '★ Сироп к любому напитку бесплатно', 'cl.perk3': '★ Бонусами можно оплатить до {p}% заказа',
      'cl.perk1s': '★ {p}% с каждого заказа бонусами', 'cl.perk2s': '★ Сироп к напитку бесплатно', 'cl.perk3s': '★ Оплачивайте бонусами до {p}% заказа',
      'cl.orders': 'Мои заказы', 'cl.history': 'История бонусов', 'cl.noorders': 'Заказов пока нет.', 'cl.nohistory': 'Пока пусто. Бонусы начислятся после первого заказа.',
      'cl.logout': 'Выйти', 'cl.loggedout': 'Вы вышли из клуба', 'cl.welcome': 'Добро пожаловать в клуб!',
      'cl.intro': 'Войдите по номеру телефона. Регистрация не нужна: новый номер сразу становится участником клуба. Заказывать можно и без входа, как гость.',
      'cl.yourname': 'Ваше имя', 'cl.getcode': 'Получить код', 'cl.sentto': 'Мы отправили код на {phone}.',
      'cl.demo': 'Демо-режим: SMS не отправляются. Ваш код', 'cl.code': 'Код из SMS', 'cl.enter': 'Войти', 'cl.checking': 'Проверяем…', 'cl.changephone': 'Изменить номер',
      'r.cashback': 'Кэшбэк за заказ', 'r.order': 'Оплата бонусами', 'r.refund': 'Возврат бонусов', 'r.adjust': 'Корректировка',
      's.awaiting_payment': 'ждёт оплаты', 's.new': 'принят', 's.preparing': 'готовится', 's.ready': 'готов', 's.done': 'выдан', 's.cancelled': 'отменён',
      // страница заказа
      'tr.title': 'Мой заказ — DrinkStar', 'tr.loading': 'Загружаем…', 'tr.order': 'Заказ', 'tr.s1': 'Принят', 'tr.s2': 'Готовится', 'tr.s3': 'Готов', 'tr.s4': 'Выдан',
      'tr.t.awaiting_payment': 'Ожидаем оплату', 'tr.h.awaiting_payment': 'Заказ уйдёт бариста сразу после оплаты. Ссылка действует 15 минут.',
      'tr.t.new': 'Заказ принят', 'tr.h.new': 'Бариста скоро возьмёт его в работу.',
      'tr.t.preparing': 'Готовим ваш заказ', 'tr.h.preparing': 'Ещё пара минут, мир подождёт.',
      'tr.t.ready': 'Заказ готов!', 'tr.h.ready': 'Можно забирать на кассе.',
      'tr.t.done': 'Приятного!', 'tr.h.done': 'Спасибо, что выбрали DrinkStar.',
      'tr.t.cancelled': 'Заказ отменён', 'tr.h.cancelled': 'Если это ошибка, позвоните в кофейню.',
      'tr.pay': 'Оплатить {sum}', 'tr.paidonline': '✓ Оплачено онлайн', 'tr.paycash': 'Оплата на кассе при получении', 'tr.bonuspaid': 'Оплачено бонусами',
      'tr.bonusdone': '★ Бонусы за этот заказ начислены', 'tr.bonussoon': '★ +{n} бонусов после получения заказа', 'tr.home': '← На главную',
      'tr.say': '☕ Назовите номер {n} на кассе', 'tr.notfound': 'Заказ не найден.', 'tr.nonumber': 'Нет номера заказа.', 'tr.ready.title': '☕ Заказ готов!',
      // демо-оплата
      'pm.title': 'Оплата заказа — DrinkStar', 'pm.demo': 'Демо-оплата', 'pm.h1': 'Оплата заказа', 'pm.card': 'Номер карты', 'pm.exp': 'Срок', 'pm.pay': 'Оплатить',
      'pm.processing': 'Обработка…', 'pm.note': 'Это демонстрация. Деньги не списываются. В боевой версии здесь откроется страница банка.',
      'pm.order': 'Заказ №{n} · {loc}', 'pm.nf': 'Заказ не найден', 'pm.fail': 'Не удалось провести оплату',
      'lg.consent.club': 'Я принимаю <a href="legal.html?doc=privacy" target="_blank">Политику конфиденциальности</a> и <a href="legal.html?doc=club" target="_blank">Правила клуба</a> и даю согласие на обработку моих персональных данных',
      'lg.consent.order': 'Я принимаю <a href="legal.html?doc=terms" target="_blank">Публичную оферту</a> и <a href="legal.html?doc=privacy" target="_blank">Политику конфиденциальности</a>, даю согласие на обработку персональных данных',
      'lg.marketing': 'Хочу получать акции и новости (необязательно)', 'lg.needconsent': 'Подтвердите согласие, поставив галочку',
      'lg.delete': 'Удалить мои данные', 'lg.deleteconfirm': 'Удалить аккаунт и персональные данные? Бонусы будут аннулированы. Это нельзя отменить.', 'lg.deleted': 'Ваши данные удалены',
      'lg.privacy': 'Политика конфиденциальности', 'lg.terms': 'Публичная оферта', 'lg.club': 'Правила клуба', 'lg.bin': 'БИН', 'lg.companyph': '[название организации, БИН, адрес]',
      // экран персонала
      'st.tab': 'Заказы — DrinkStar', 'st.login': 'Персонал', 'st.pin': 'PIN', 'st.enter': 'Войти', 'st.badpin': 'Неверный PIN',
      'st.title': '★ Заказы', 'st.online': 'онлайн', 'st.offline': 'нет связи', 'st.all': 'Все кофейни',
      'st.sound': '🔔 Звук', 'st.mute': '🔕 Без звука', 'st.logout': 'Выйти',
      'st.col.new': 'Новые', 'st.col.preparing': 'Готовятся', 'st.col.ready': 'Готовы к выдаче', 'st.empty': 'Пусто',
      'st.now': 'только что', 'st.min': '{n} мин назад', 'st.club': '★ Клуб', 'st.bonuspaid': 'Бонусами оплачено: {n} ₸',
      'st.paidonline': '✓ Оплачено онлайн', 'st.takecash': '💵 Принять на кассе: {n} ₸',
      'st.act.new': 'Взять в работу', 'st.act.preparing': 'Готов', 'st.act.ready': 'Выдан', 'st.cancel': 'Отменить', 'st.confirmcancel': 'Отменить заказ?',
      // аналитика
      'ad.tab': 'Аналитика — DrinkStar', 'ad.login': 'Аналитика', 'ad.title': '★ Аналитика',
      'ad.p1': 'Сегодня', 'ad.p7': '7 дней', 'ad.p30': '30 дней', 'ad.p90': '90 дней', 'ad.allloc': 'Все кофейни', 'ad.csv': 'Скачать CSV',
      'ad.revenue': 'Выручка', 'ad.revenue.s': 'до вычета бонусов', 'ad.orders': 'Заказов', 'ad.orders.s': 'без отменённых', 'ad.avg': 'Средний чек',
      'ad.money': 'Деньгами', 'ad.money.s': 'бонусами: {n}', 'ad.clubshare': 'Заказов от клуба', 'ad.clubshare.s': '{a} из {b}',
      'ad.members': 'Участников клуба', 'ad.members.s': 'новых за период: {a} · вернулись: {b}', 'ad.bonus': 'Бонусов на руках', 'ad.bonus.s': 'начислено за период: {n}',
      'ad.none': 'За выбранный период заказов пока нет.', 'ad.byday': 'Выручка по дням', 'ad.byhour': 'Загрузка по часам (Астана)', 'ad.paytype': 'Способ оплаты',
      'ad.online': 'Онлайн', 'ad.cash': 'На кассе', 'ad.top': 'Топ позиций', 'ad.byloc': 'По кофейням', 'ad.ord': 'зак.', 'ad.pcs': 'шт', 'ad.toomany': 'Слишком много попыток'
    },

    kk: {
      'title': 'DrinkStar Coffee&more — Pause the world',
      'nav.fall': 'Жаңалықтар', 'nav.menu': 'Мәзір', 'nav.vibe': 'Атмосфера', 'nav.places': 'Мекенжайлар', 'nav.club': 'Клуб',
      'nav.myorder': 'Менің тапсырысым', 'nav.cart': 'Себет', 'nav.close': 'Жабу',
      'hero.eyebrow': 'DrinkStar Coffee&more · Астана',
      'hero.text': 'Әлем күте тұрсын. Жайлап отырып, жаңа қайнатылған кофенің хош иісін сезініп, өзіңізге бір минут тыныштық сыйлаңыз. Астанада сегіз жайлы орын.',
      'hero.menu': 'Мәзірді көру', 'hero.places': 'Мекенжай және жұмыс уақыты',
      'hero.tag1': '100% арабика', 'hero.tag2': 'Жаңа қуырылған', 'hero.tag3': 'Десерттер мен пісірмелер',
      'fall.eyebrow': 'Маусымдық жаңалық', 'fall.lead': 'Жаңбырлы күз бен жұмсақ пледтің иісі келетін үш күзгі дәм. 0,4 л — 1 590 ₸.',
      'menu.eyebrow': 'Мәзір', 'menu.title': 'Көңіл-күйіңізді таңдаңыз',
      'menu.lead': '100% арабика кофесі, шай, лимонадтар және десерттер. Тапсырысқа қосу үшін бағаны басыңыз.',
      'menu.addons': 'Қосымшалар', 'menu.soon': 'бағасы жақында',
      'menu.clubtext': 'Клуб мүшелеріне: кез келген сусынға сироп — 0 ₸ және әр тапсырыстан {p}% бонус.', 'menu.clubbtn': 'Клубқа кіру',
      'vibe.eyebrow': 'Атмосфера', 'vibe.title': 'Аялдап, тынығатын орын',
      'vibe.lead': 'Жылы жарық, ағаш, кофенің иісі. Кездесуге, ноутбукпен жұмыс істеуге және тыныш таңға арналған.',
      'vibe.1': 'Таңғы кофе', 'vibe.2': 'Достармен кеш', 'vibe.3': 'Ноутбукпен жұмыс', 'vibe.4': 'Бариста жұмыс үстінде',
      'places.eyebrow': 'Мекенжайлар', 'places.title': 'Астанада 8 орын', 'places.lead': '«Ашық» мәртебесі Астана уақыты бойынша есептеледі.',
      'places.2gis': 'Барлық нүктелер 2GIS-те ↗', 'places.open': 'Ашық', 'places.closed': 'Жабық', 'places.route': 'Бағыт →',
      'club.eyebrow': 'DrinkStar Club', 'club.title': 'Сізді еске сақтайтын кофе',
      'club.lead': 'Телефон нөмірімен кіріп, әр тапсырыстан көбірек пайда алыңыз. Кірмей-ақ, қонақ ретінде тапсырыс беруге болады.',
      'club.perk1': 'әр тапсырыстан бонус болып қайтады', 'club.perk2': 'кез келген сусынға сироп тегін',
      'club.perk3': 'тапсырысты жинақталған бонуспен төлеуге болады', 'club.join': 'Клубқа қосылу',
      'footer.copy': '© DrinkStar. Сайттың демо-нұсқасы.',
      'cart.title': 'Сіздің тапсырысыңыз', 'cart.empty': 'Себет бос.<br>Мәзірден дәмді бірдеңе таңдаңыз.', 'cart.added': '{name} қосылды',
      'cart.free': '★ тегін', 'cart.where': 'Қайдан аласыз', 'cart.choose': 'Кофеханаңызды таңдаңыз', 'cart.until': '{t} дейін', 'cart.closed': 'жабық',
      'cart.name': 'Аты', 'cart.phone': 'Телефон', 'cart.comment': 'Пікір', 'cart.commentPh': 'Мысалы: қантсыз',
      'cart.total': 'Барлығы', 'cart.topay': 'Төленетіні', 'cart.sum': 'Сома', 'cart.bonuses': 'Бонуспен',
      'cart.online': 'Онлайн төлеу', 'cart.cash': 'Кассада', 'cart.cashsub': 'алған кезде',
      'cart.pickup': 'Өзіңіз алып кетесіз', 'cart.pickupcash': 'Өзіңіз алып кетесіз. Төлем алу кезінде кассада',
      'cart.submit': 'Тапсырыс беру · {sum}', 'cart.sending': 'Жіберілуде…', 'cart.menufail': 'Мәзір жүктелмеді. Серверді қосыңыз: npm start',
      'cc.member': '★ Клуб · {n} бонус', 'cc.willreturn': 'Тапсырысты алғаннан кейін +{n} бонус қайтарылады', 'cc.keep': 'Әр тапсырыстан бонус жинаңыз',
      'cc.spend': '{n} жұмсау', 'cc.guest': '★ Клуб мүшелеріне', 'cc.guesttext': 'Тапсырыстан {p}% бонус және сироп тегін. Сіз қонақ ретінде тапсырыс беріп жатырсыз.', 'cc.login': 'Кіру',
      'cl.btn': '★ Клубқа кіру', 'cl.short': 'Клуб', 'cl.hello': 'Сәлем, {name}!', 'cl.guestname': 'клуб қонағы', 'cl.bonuses': 'бонус', 'cl.rate': '1 бонус = 1 ₸',
      'cl.perk1': '★ әр тапсырыстан {p}% бонус болып қайтады', 'cl.perk2': '★ Кез келген сусынға сироп тегін', 'cl.perk3': '★ Тапсырыстың {p}% дейінгі бөлігін бонуспен төлеуге болады',
      'cl.perk1s': '★ әр тапсырыстан {p}% бонус', 'cl.perk2s': '★ Сусынға сироп тегін', 'cl.perk3s': '★ Тапсырыстың {p}% дейінгі бөлігін бонуспен төлеңіз',
      'cl.orders': 'Менің тапсырыстарым', 'cl.history': 'Бонус тарихы', 'cl.noorders': 'Әзірге тапсырыс жоқ.', 'cl.nohistory': 'Әзірге бос. Бонус алғашқы тапсырыстан кейін есептеледі.',
      'cl.logout': 'Шығу', 'cl.loggedout': 'Сіз клубтан шықтыңыз', 'cl.welcome': 'Клубқа қош келдіңіз!',
      'cl.intro': 'Телефон нөмірімен кіріңіз. Тіркелудің қажеті жоқ: жаңа нөмір бірден клуб мүшесі болады. Кірмей-ақ, қонақ ретінде тапсырыс беруге болады.',
      'cl.yourname': 'Атыңыз', 'cl.getcode': 'Код алу', 'cl.sentto': 'Код {phone} нөміріне жіберілді.',
      'cl.demo': 'Демо-режим: SMS жіберілмейді. Сіздің кодыңыз', 'cl.code': 'SMS-тегі код', 'cl.enter': 'Кіру', 'cl.checking': 'Тексерілуде…', 'cl.changephone': 'Нөмірді өзгерту',
      'r.cashback': 'Тапсырыс үшін кэшбэк', 'r.order': 'Бонуспен төлем', 'r.refund': 'Бонусты қайтару', 'r.adjust': 'Түзету',
      's.awaiting_payment': 'төлем күтілуде', 's.new': 'қабылданды', 's.preparing': 'дайындалуда', 's.ready': 'дайын', 's.done': 'берілді', 's.cancelled': 'бас тартылды',
      'tr.title': 'Менің тапсырысым — DrinkStar', 'tr.loading': 'Жүктелуде…', 'tr.order': 'Тапсырыс', 'tr.s1': 'Қабылданды', 'tr.s2': 'Дайындалуда', 'tr.s3': 'Дайын', 'tr.s4': 'Берілді',
      'tr.t.awaiting_payment': 'Төлем күтілуде', 'tr.h.awaiting_payment': 'Тапсырыс төлемнен кейін бірден баристаға жіберіледі. Сілтеме 15 минут жарамды.',
      'tr.t.new': 'Тапсырыс қабылданды', 'tr.h.new': 'Бариста жақында жұмысқа кіріседі.',
      'tr.t.preparing': 'Тапсырысыңыз дайындалуда', 'tr.h.preparing': 'Тағы бір-екі минут, әлем күте тұрсын.',
      'tr.t.ready': 'Тапсырыс дайын!', 'tr.h.ready': 'Кассадан алуға болады.',
      'tr.t.done': 'Ішіңіз құт болсын!', 'tr.h.done': 'DrinkStar-ды таңдағаныңыз үшін рахмет.',
      'tr.t.cancelled': 'Тапсырыстан бас тартылды', 'tr.h.cancelled': 'Егер бұл қате болса, кофеханаға қоңырау шалыңыз.',
      'tr.pay': '{sum} төлеу', 'tr.paidonline': '✓ Онлайн төленді', 'tr.paycash': 'Төлем алу кезінде кассада', 'tr.bonuspaid': 'Бонуспен төленді',
      'tr.bonusdone': '★ Осы тапсырыс үшін бонус есептелді', 'tr.bonussoon': '★ Тапсырысты алғаннан кейін +{n} бонус', 'tr.home': '← Басты бетке',
      'tr.say': '☕ Кассада {n} нөмірін айтыңыз', 'tr.notfound': 'Тапсырыс табылмады.', 'tr.nonumber': 'Тапсырыс нөмірі жоқ.', 'tr.ready.title': '☕ Тапсырыс дайын!',
      'pm.title': 'Тапсырысты төлеу — DrinkStar', 'pm.demo': 'Демо-төлем', 'pm.h1': 'Тапсырысты төлеу', 'pm.card': 'Карта нөмірі', 'pm.exp': 'Мерзімі', 'pm.pay': 'Төлеу',
      'pm.processing': 'Өңделуде…', 'pm.note': 'Бұл — көрсетілім. Ақша алынбайды. Нақты нұсқада мұнда банктің беті ашылады.',
      'pm.order': '№{n} тапсырыс · {loc}', 'pm.nf': 'Тапсырыс табылмады', 'pm.fail': 'Төлемді жүргізу мүмкін болмады',
      'lg.consent.club': '<a href="legal.html?doc=privacy" target="_blank">Құпиялылық саясатын</a> және <a href="legal.html?doc=club" target="_blank">Клуб ережелерін</a> қабылдаймын және дербес деректерімді өңдеуге келісім беремін',
      'lg.consent.order': '<a href="legal.html?doc=terms" target="_blank">Жария офертаны</a> және <a href="legal.html?doc=privacy" target="_blank">Құпиялылық саясатын</a> қабылдаймын, дербес деректерді өңдеуге келісім беремін',
      'lg.marketing': 'Акциялар мен жаңалықтарды алғым келеді (міндетті емес)', 'lg.needconsent': 'Құсбелгі қою арқылы келісімді растаңыз',
      'lg.delete': 'Деректерімді жою', 'lg.deleteconfirm': 'Есептік жазба мен дербес деректер жойылсын ба? Бонустар жойылады. Мұны қайтару мүмкін емес.', 'lg.deleted': 'Деректеріңіз жойылды',
      'lg.privacy': 'Құпиялылық саясаты', 'lg.terms': 'Жария оферта', 'lg.club': 'Клуб ережелері', 'lg.bin': 'БСН', 'lg.companyph': '[ұйым атауы, БСН, мекенжай]',
      'st.tab': 'Тапсырыстар — DrinkStar', 'st.login': 'Қызметкерлер', 'st.pin': 'PIN', 'st.enter': 'Кіру', 'st.badpin': 'PIN дұрыс емес',
      'st.title': '★ Тапсырыстар', 'st.online': 'онлайн', 'st.offline': 'байланыс жоқ', 'st.all': 'Барлық кофеханалар',
      'st.sound': '🔔 Дыбыс', 'st.mute': '🔕 Дыбыссыз', 'st.logout': 'Шығу',
      'st.col.new': 'Жаңа', 'st.col.preparing': 'Дайындалуда', 'st.col.ready': 'Беруге дайын', 'st.empty': 'Бос',
      'st.now': 'жаңа ғана', 'st.min': '{n} мин бұрын', 'st.club': '★ Клуб', 'st.bonuspaid': 'Бонуспен төленді: {n} ₸',
      'st.paidonline': '✓ Онлайн төленген', 'st.takecash': '💵 Кассада қабылдау: {n} ₸',
      'st.act.new': 'Жұмысқа алу', 'st.act.preparing': 'Дайын', 'st.act.ready': 'Берілді', 'st.cancel': 'Бас тарту', 'st.confirmcancel': 'Тапсырыстан бас тартасыз ба?',
      'ad.tab': 'Аналитика — DrinkStar', 'ad.login': 'Аналитика', 'ad.title': '★ Аналитика',
      'ad.p1': 'Бүгін', 'ad.p7': '7 күн', 'ad.p30': '30 күн', 'ad.p90': '90 күн', 'ad.allloc': 'Барлық кофеханалар', 'ad.csv': 'CSV жүктеу',
      'ad.revenue': 'Түсім', 'ad.revenue.s': 'бонусты шегергенге дейін', 'ad.orders': 'Тапсырыс', 'ad.orders.s': 'бас тартылғандарсыз', 'ad.avg': 'Орташа чек',
      'ad.money': 'Ақшамен', 'ad.money.s': 'бонуспен: {n}', 'ad.clubshare': 'Клубтан тапсырыс', 'ad.clubshare.s': '{b} ішінен {a}',
      'ad.members': 'Клуб мүшелері', 'ad.members.s': 'кезеңдегі жаңалары: {a} · қайта келгені: {b}', 'ad.bonus': 'Қолдағы бонус', 'ad.bonus.s': 'кезеңде есептелді: {n}',
      'ad.none': 'Таңдалған кезеңде тапсырыс әлі жоқ.', 'ad.byday': 'Күн бойынша түсім', 'ad.byhour': 'Сағат бойынша жүктеме (Астана)', 'ad.paytype': 'Төлем тәсілі',
      'ad.online': 'Онлайн', 'ad.cash': 'Кассада', 'ad.top': 'Үздік позициялар', 'ad.byloc': 'Кофеханалар бойынша', 'ad.ord': 'тапс.', 'ad.pcs': 'дана', 'ad.toomany': 'Әрекет тым көп'
    },

    en: {
      'title': 'DrinkStar Coffee&more — Pause the world',
      'nav.fall': 'New', 'nav.menu': 'Menu', 'nav.vibe': 'Vibe', 'nav.places': 'Locations', 'nav.club': 'Club',
      'nav.myorder': 'My order', 'nav.cart': 'Cart', 'nav.close': 'Close',
      'hero.eyebrow': 'DrinkStar Coffee&more · Astana',
      'hero.text': 'The world can wait. Sit back, breathe in the aroma of freshly brewed coffee and give yourself a minute of quiet. Eight cozy places in Astana.',
      'hero.menu': 'View the menu', 'hero.places': 'Locations & hours',
      'hero.tag1': '100% Arabica', 'hero.tag2': 'Freshly roasted', 'hero.tag3': 'Desserts & pastries',
      'fall.eyebrow': 'Seasonal special', 'fall.lead': 'Three autumn flavors that smell like a warm blanket and rain outside. 0.4 l — 1 590 ₸.',
      'menu.eyebrow': 'Menu', 'menu.title': 'Pick your mood',
      'menu.lead': '100% Arabica coffee, tea, lemonades and desserts. Tap a price to add it to your order.',
      'menu.addons': 'Add-ons', 'menu.soon': 'price soon',
      'menu.clubtext': 'Club members: syrup with any drink for 0 ₸ and {p}% back in bonuses on every order.', 'menu.clubbtn': 'Join the club',
      'vibe.eyebrow': 'Vibe', 'vibe.title': 'A place to slow down',
      'vibe.lead': 'Warm light, wood, the smell of coffee. For meetups, laptop work and quiet mornings.',
      'vibe.1': 'Morning coffee', 'vibe.2': 'Evening with friends', 'vibe.3': 'Working on a laptop', 'vibe.4': 'Barista at work',
      'places.eyebrow': 'Locations', 'places.title': '8 places in Astana', 'places.lead': 'The “open” status is based on Astana time.',
      'places.2gis': 'All locations on 2GIS ↗', 'places.open': 'Open', 'places.closed': 'Closed', 'places.route': 'Directions →',
      'club.eyebrow': 'DrinkStar Club', 'club.title': 'Coffee that remembers you',
      'club.lead': 'Sign in with your phone number and get more from every order. You can also order as a guest without signing in.',
      'club.perk1': 'of every order comes back as bonuses', 'club.perk2': 'syrup with any drink is free',
      'club.perk3': 'of an order can be paid with your bonuses', 'club.join': 'Join the club',
      'footer.copy': '© DrinkStar. Demo version of the site.',
      'cart.title': 'Your order', 'cart.empty': 'Your cart is empty.<br>Pick something tasty from the menu.', 'cart.added': '{name} added',
      'cart.free': '★ free', 'cart.where': 'Pick up at', 'cart.choose': 'Choose a coffee shop', 'cart.until': 'until {t}', 'cart.closed': 'closed',
      'cart.name': 'Name', 'cart.phone': 'Phone', 'cart.comment': 'Comment', 'cart.commentPh': 'E.g. no sugar',
      'cart.total': 'Total', 'cart.topay': 'To pay', 'cart.sum': 'Subtotal', 'cart.bonuses': 'Bonuses',
      'cart.online': 'Pay online', 'cart.cash': 'At the counter', 'cart.cashsub': 'on pickup',
      'cart.pickup': 'Pickup order', 'cart.pickupcash': 'Pickup order. Pay at the counter when you collect it',
      'cart.submit': 'Place order · {sum}', 'cart.sending': 'Sending…', 'cart.menufail': 'Could not load the menu. Start the server: npm start',
      'cc.member': '★ Club · {n} bonuses', 'cc.willreturn': '+{n} bonuses will be added after you pick up the order', 'cc.keep': 'Earn bonuses with every order',
      'cc.spend': 'Use {n}', 'cc.guest': '★ For club members', 'cc.guesttext': '{p}% back in bonuses and free syrup. You are ordering as a guest.', 'cc.login': 'Sign in',
      'cl.btn': '★ Join the club', 'cl.short': 'Club', 'cl.hello': 'Hi, {name}!', 'cl.guestname': 'club guest', 'cl.bonuses': 'bonuses', 'cl.rate': '1 bonus = 1 ₸',
      'cl.perk1': '★ {p}% of every order comes back as bonuses', 'cl.perk2': '★ Syrup with any drink is free', 'cl.perk3': '★ Pay up to {p}% of an order with bonuses',
      'cl.perk1s': '★ {p}% back in bonuses on every order', 'cl.perk2s': '★ Free syrup with your drink', 'cl.perk3s': '★ Pay up to {p}% of an order with bonuses',
      'cl.orders': 'My orders', 'cl.history': 'Bonus history', 'cl.noorders': 'No orders yet.', 'cl.nohistory': 'Nothing yet. Bonuses are added after your first order.',
      'cl.logout': 'Sign out', 'cl.loggedout': 'You have signed out', 'cl.welcome': 'Welcome to the club!',
      'cl.intro': 'Sign in with your phone number. No registration needed: a new number becomes a club member right away. You can also order as a guest.',
      'cl.yourname': 'Your name', 'cl.getcode': 'Get code', 'cl.sentto': 'We sent a code to {phone}.',
      'cl.demo': 'Demo mode: no SMS is sent. Your code is', 'cl.code': 'SMS code', 'cl.enter': 'Sign in', 'cl.checking': 'Checking…', 'cl.changephone': 'Change number',
      'r.cashback': 'Order cashback', 'r.order': 'Paid with bonuses', 'r.refund': 'Bonus refund', 'r.adjust': 'Adjustment',
      's.awaiting_payment': 'awaiting payment', 's.new': 'received', 's.preparing': 'preparing', 's.ready': 'ready', 's.done': 'completed', 's.cancelled': 'cancelled',
      'tr.title': 'My order — DrinkStar', 'tr.loading': 'Loading…', 'tr.order': 'Order', 'tr.s1': 'Received', 'tr.s2': 'Preparing', 'tr.s3': 'Ready', 'tr.s4': 'Collected',
      'tr.t.awaiting_payment': 'Waiting for payment', 'tr.h.awaiting_payment': 'The barista gets your order right after payment. The link is valid for 15 minutes.',
      'tr.t.new': 'Order received', 'tr.h.new': 'The barista will start on it shortly.',
      'tr.t.preparing': 'Preparing your order', 'tr.h.preparing': 'A couple more minutes, the world can wait.',
      'tr.t.ready': 'Your order is ready!', 'tr.h.ready': 'Pick it up at the counter.',
      'tr.t.done': 'Enjoy!', 'tr.h.done': 'Thank you for choosing DrinkStar.',
      'tr.t.cancelled': 'Order cancelled', 'tr.h.cancelled': 'If this is a mistake, please call the coffee shop.',
      'tr.pay': 'Pay {sum}', 'tr.paidonline': '✓ Paid online', 'tr.paycash': 'Pay at the counter on pickup', 'tr.bonuspaid': 'Paid with bonuses',
      'tr.bonusdone': '★ Bonuses for this order have been added', 'tr.bonussoon': '★ +{n} bonuses after you pick up the order', 'tr.home': '← Back to home',
      'tr.say': '☕ Tell the counter your number: {n}', 'tr.notfound': 'Order not found.', 'tr.nonumber': 'No order number.', 'tr.ready.title': '☕ Your order is ready!',
      'pm.title': 'Pay for your order — DrinkStar', 'pm.demo': 'Demo payment', 'pm.h1': 'Pay for your order', 'pm.card': 'Card number', 'pm.exp': 'Expires', 'pm.pay': 'Pay',
      'pm.processing': 'Processing…', 'pm.note': 'This is a demo. No money is charged. In the live version the bank page opens here.',
      'pm.order': 'Order #{n} · {loc}', 'pm.nf': 'Order not found', 'pm.fail': 'Could not process the payment',
      'lg.consent.club': 'I accept the <a href="legal.html?doc=privacy" target="_blank">Privacy Policy</a> and the <a href="legal.html?doc=club" target="_blank">Club Rules</a> and consent to the processing of my personal data',
      'lg.consent.order': 'I accept the <a href="legal.html?doc=terms" target="_blank">Public Offer</a> and the <a href="legal.html?doc=privacy" target="_blank">Privacy Policy</a> and consent to the processing of my personal data',
      'lg.marketing': 'I would like to receive offers and news (optional)', 'lg.needconsent': 'Please tick the checkbox to confirm your consent',
      'lg.delete': 'Delete my data', 'lg.deleteconfirm': 'Delete your account and personal data? Your bonuses will be cancelled. This cannot be undone.', 'lg.deleted': 'Your data has been deleted',
      'lg.privacy': 'Privacy Policy', 'lg.terms': 'Public Offer', 'lg.club': 'Club Rules', 'lg.bin': 'BIN', 'lg.companyph': '[organisation name, BIN, address]',
      'st.tab': 'Orders — DrinkStar', 'st.login': 'Staff', 'st.pin': 'PIN', 'st.enter': 'Sign in', 'st.badpin': 'Wrong PIN',
      'st.title': '★ Orders', 'st.online': 'online', 'st.offline': 'no connection', 'st.all': 'All coffee shops',
      'st.sound': '🔔 Sound', 'st.mute': '🔕 Muted', 'st.logout': 'Sign out',
      'st.col.new': 'New', 'st.col.preparing': 'Preparing', 'st.col.ready': 'Ready for pickup', 'st.empty': 'Empty',
      'st.now': 'just now', 'st.min': '{n} min ago', 'st.club': '★ Club', 'st.bonuspaid': 'Paid with bonuses: {n} ₸',
      'st.paidonline': '✓ Paid online', 'st.takecash': '💵 Take at the counter: {n} ₸',
      'st.act.new': 'Start', 'st.act.preparing': 'Ready', 'st.act.ready': 'Collected', 'st.cancel': 'Cancel', 'st.confirmcancel': 'Cancel this order?',
      'ad.tab': 'Analytics — DrinkStar', 'ad.login': 'Analytics', 'ad.title': '★ Analytics',
      'ad.p1': 'Today', 'ad.p7': '7 days', 'ad.p30': '30 days', 'ad.p90': '90 days', 'ad.allloc': 'All coffee shops', 'ad.csv': 'Download CSV',
      'ad.revenue': 'Revenue', 'ad.revenue.s': 'before bonuses', 'ad.orders': 'Orders', 'ad.orders.s': 'excluding cancelled', 'ad.avg': 'Average check',
      'ad.money': 'Paid in money', 'ad.money.s': 'with bonuses: {n}', 'ad.clubshare': 'Club orders', 'ad.clubshare.s': '{a} of {b}',
      'ad.members': 'Club members', 'ad.members.s': 'new in period: {a} · returned: {b}', 'ad.bonus': 'Bonuses outstanding', 'ad.bonus.s': 'earned in period: {n}',
      'ad.none': 'No orders in the selected period yet.', 'ad.byday': 'Revenue by day', 'ad.byhour': 'Orders by hour (Astana)', 'ad.paytype': 'Payment method',
      'ad.online': 'Online', 'ad.cash': 'At the counter', 'ad.top': 'Top items', 'ad.byloc': 'By coffee shop', 'ad.ord': 'orders', 'ad.pcs': 'pcs', 'ad.toomany': 'Too many attempts'
    }
  };

  function detect() {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (LANGS.includes(q)) { localStorage.setItem('ds_lang', q); return q; }
      const s = localStorage.getItem('ds_lang');
      if (LANGS.includes(s)) return s;
    } catch { /* приватный режим */ }
    const n = (navigator.language || 'ru').slice(0, 2).toLowerCase();
    return n === 'kk' ? 'kk' : n === 'en' ? 'en' : 'ru';
  }
  const LANG = detect();
  document.documentElement.lang = LANG;

  const t = (key, vars) => {
    let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.ru[key] ?? key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };
  // поле данных на нужном языке: name_kk / name_en, иначе русское name
  const tr = (obj, field) => (obj && (obj[field + '_' + LANG] || obj[field])) || '';
  // «0,4» -> «0.4» для английского
  const num = s => (LANG === 'en' ? String(s).replace(',', '.') : s);

  function setLang(l) {
    try { localStorage.setItem('ds_lang', l); } catch { /* ignore */ }
    const u = new URL(location.href); u.searchParams.delete('lang');
    location.href = u.toString();
  }
  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
    if (document.documentElement.dataset.title) document.title = t(document.documentElement.dataset.title);
    document.querySelectorAll('.lang').forEach(box => {
      box.innerHTML = LANGS.map(l => `<button type="button" class="${l === LANG ? 'on' : ''}" data-lang="${l}" aria-label="${LABEL[l]}">${LABEL[l]}</button>`).join('');
      box.onclick = e => { const b = e.target.closest('[data-lang]'); if (b && b.dataset.lang !== LANG) setLang(b.dataset.lang); };
    });
  }
  window.I18N = { LANG, LOCALE: LOCALE[LANG], t, tr, num, setLang, applyStatic };
  window.t = t; window.tr = tr;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyStatic); else applyStatic();
})();
