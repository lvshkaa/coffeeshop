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
      'cart.free': '[[star]] бесплатно', 'cart.where': 'Где заберёте', 'cart.choose': 'Выберите кофейню', 'cart.until': 'до {t}', 'cart.closed': 'закрыто',
      'cart.name': 'Имя', 'cart.phone': 'Телефон', 'cart.comment': 'Комментарий', 'cart.commentPh': 'Например: без сахара',
      'cart.total': 'Итого', 'cart.topay': 'К оплате', 'cart.sum': 'Сумма', 'cart.bonuses': 'Бонусами',
      'cart.online': 'Оплатить онлайн', 'cart.cash': 'На кассе', 'cart.cashsub': 'при получении',
      'cart.pickup': 'Заказ на самовывоз', 'cart.pickupcash': 'Заказ на самовывоз. Оплата на кассе при получении',
      'cart.submit': 'Оформить заказ · {sum}', 'cart.sending': 'Отправляем…', 'cart.menufail': 'Не удалось загрузить меню. Запустите сервер: npm start',
      'cc.member': '[[star]] Клуб · {n} бонусов', 'cc.willreturn': '+{n} бонусов вернётся после получения заказа', 'cc.keep': 'Копите бонусы с каждого заказа',
      'cc.spend': 'Списать {n}', 'cc.guest': '[[star]] Участникам клуба', 'cc.guesttext': '{p}% бонусами с заказа и сироп бесплатно. Вы заказываете как гость.', 'cc.login': 'Войти',
      'cl.btn': '[[star]] Войти в клуб', 'cl.short': 'Клуб', 'cl.hello': 'Привет, {name}!', 'cl.guestname': 'гость клуба', 'cl.bonuses': 'бонусов', 'cl.rate': '1 бонус = 1 ₸',
      'cl.perk1': '[[star]] {p}% с каждого заказа возвращается бонусами', 'cl.perk2': '[[star]] Сироп к любому напитку бесплатно', 'cl.perk3': '[[star]] Бонусами можно оплатить до {p}% заказа',
      'cl.perk1s': '[[star]] {p}% с каждого заказа бонусами', 'cl.perk2s': '[[star]] Сироп к напитку бесплатно', 'cl.perk3s': '[[star]] Оплачивайте бонусами до {p}% заказа',
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
      'tr.pay': 'Оплатить {sum}', 'tr.paidonline': '[[check]] Оплачено онлайн', 'tr.paycash': 'Оплата на кассе при получении', 'tr.bonuspaid': 'Оплачено бонусами',
      'tr.bonusdone': '[[star]] Бонусы за этот заказ начислены', 'tr.bonussoon': '[[star]] +{n} бонусов после получения заказа', 'tr.home': '← На главную',
      'tr.say': '[[coffee]] Назовите номер {n} на кассе', 'tr.notfound': 'Заказ не найден.', 'tr.nonumber': 'Нет номера заказа.', 'tr.ready.title': '[[coffee]] Заказ готов!',
      // демо-оплата
      'pm.title': 'Оплата заказа — DrinkStar', 'pm.demo': 'Демо-оплата', 'pm.h1': 'Оплата заказа', 'pm.card': 'Номер карты', 'pm.exp': 'Срок', 'pm.pay': 'Оплатить',
      'pm.processing': 'Обработка…', 'pm.note': 'Это демонстрация. Деньги не списываются. В боевой версии здесь откроется страница банка.',
      'pm.order': 'Заказ №{n} · {loc}', 'pm.nf': 'Заказ не найден', 'pm.fail': 'Не удалось провести оплату',
      'lg.consent.club': 'Я принимаю <a href="legal.html?doc=privacy" target="_blank">Политику конфиденциальности</a> и <a href="legal.html?doc=club" target="_blank">Правила клуба</a> и даю согласие на обработку моих персональных данных',
      'lg.consent.order': 'Я принимаю <a href="legal.html?doc=terms" target="_blank">Публичную оферту</a> и <a href="legal.html?doc=privacy" target="_blank">Политику конфиденциальности</a>, даю согласие на обработку персональных данных',
      'lg.marketing': 'Хочу получать акции и новости (необязательно)', 'lg.needconsent': 'Подтвердите согласие, поставив галочку',
      'lg.delete': 'Удалить мои данные', 'lg.deleteconfirm': 'Удалить аккаунт и персональные данные? Бонусы будут аннулированы. Это нельзя отменить.', 'lg.deleted': 'Ваши данные удалены',
      'lg.privacy': 'Политика конфиденциальности', 'lg.terms': 'Публичная оферта', 'lg.club': 'Правила клуба', 'lg.bin': 'БИН', 'lg.companyph': '[название организации, БИН, адрес]',
      // звук
      'snd.new': 'Новый заказ номер {n}', 'snd.readyself': 'Ваш заказ номер {n} готов, можно забирать',
      // персонал
      'st.pinhint': 'Личный PIN', 'st.chooseloc': 'Выберите кофейню', 'st.manager.all': 'Все кофейни (менеджер)', 'st.toomany': 'Слишком много попыток. Подождите 5 минут.',
      'st.hello': 'Привет, {name}', 'st.shiftsince': 'Смена с {t}', 'st.handled': 'Выдано за смену: {n}', 'st.endshift': 'Сдать смену',
      'st.voiceon': '[[volume-2]] Голос', 'st.voiceoff': '[[volume-x]] Без голоса', 'st.acceptedby': 'Принял: {name}', 'st.readyby': 'Приготовил: {name}',
      'st.role.manager': 'Менеджер', 'st.role.barista': 'Бариста', 'st.sessionend': 'Смена завершена. Войдите снова.', 'st.tapsound': 'Нажмите на экран, чтобы включить звук', 'st.loginloc': 'Где вы сегодня работаете',
      // отзывы
      'nav.reviews': 'Отзывы', 'rv.eyebrow': 'Отзывы', 'rv.heading': 'Что говорят гости', 'rv.lead': 'Оценки гостей после получения заказа',
      'rv.count': 'Отзывов: {n}', 'rv.empty': 'Отзывов пока нет. Оставьте первый после своего заказа.', 'rv.more': 'Показать ещё', 'rv.replyby': 'Ответ DrinkStar', 'rv.avg': 'средняя оценка',
      'rv.title': 'Оцените заказ', 'rv.sub': 'Ваш отзыв помогает нам становиться лучше', 'rv.placeholder': 'Что понравилось, что улучшить? (необязательно)', 'rv.nameNote': 'На сайте покажем только ваше имя',
      'rv.send': 'Отправить отзыв', 'rv.thanks': 'Спасибо за отзыв!', 'rv.yours': 'Ваш отзыв', 'rv.reply': 'Ответ кофейни', 'rv.pickrating': 'Поставьте оценку',
      'tr.sound.off': 'Включить звук уведомления', 'tr.sound.on': 'Звук включён', 'tr.sound.hint': 'Сигнал прозвучит, когда заказ будет готов. Оставьте страницу открытой.', 'tr.sound.tap': 'Нажмите на экран, чтобы включить звук',
      // аналитика: вкладки, оценки, сотрудники
      'ad.tab.stats': 'Аналитика', 'ad.tab.staff': 'Сотрудники', 'ad.tab.reviews': 'Отзывы', 'ad.rating': 'Средняя оценка', 'ad.rating.s': 'отзывов: {n}',
      'ad.bybarista': 'По бариста', 'ad.avgmin': 'в среднем {n} мин до готовности',
      'sf.title': 'Сотрудники и смены', 'sf.add': 'Добавить сотрудника', 'sf.name': 'Имя', 'sf.role': 'Роль', 'sf.barista': 'Бариста', 'sf.manager': 'Менеджер',
      'sf.pin': 'PIN (необязательно, иначе создадим сами)', 'sf.create': 'Создать', 'sf.pinis': 'PIN сотрудника {name}: {pin}. Запишите и передайте лично, потом он не показывается.',
      'sf.onshift': 'на смене', 'sf.offshift': 'не на смене', 'sf.lastshift': 'последняя смена', 'sf.never': 'ещё не выходил', 'sf.handled': 'за 30 дней: {n}',
      'sf.reset': 'Новый PIN', 'sf.deactivate': 'Отключить', 'sf.activate': 'Включить', 'sf.inactive': 'отключён', 'sf.confirmreset': 'Выдать новый PIN? Старый перестанет работать.',
      'sf.shifts': 'Смены за 7 дней', 'sf.col.staff': 'Сотрудник', 'sf.col.loc': 'Кофейня', 'sf.col.start': 'Начало', 'sf.col.end': 'Конец', 'sf.col.orders': 'Заказов', 'sf.ongoing': 'идёт', 'sf.allloc': 'Все кофейни',
      'rw.title': 'Отзывы гостей', 'rw.hide': 'Скрыть', 'rw.show': 'Показать', 'rw.reply': 'Ответ владельца', 'rw.replyph': 'Ответ, который увидят гости на сайте', 'rw.save': 'Сохранить ответ', 'rw.hidden': 'скрыт', 'rw.order': 'заказ №{n}', 'rw.none': 'Отзывов пока нет.',
      // экран персонала
      'st.tab': 'Заказы — DrinkStar', 'st.login': 'Персонал', 'st.pin': 'PIN', 'st.enter': 'Войти', 'st.badpin': 'Неверный PIN',
      'st.title': '[[star]] Заказы', 'st.online': 'онлайн', 'st.offline': 'нет связи', 'st.all': 'Все кофейни',
      'st.sound': '[[bell]] Звук', 'st.mute': '[[bell-off]] Без звука', 'st.logout': 'Выйти',
      'st.col.new': 'Новые', 'st.col.preparing': 'Готовятся', 'st.col.ready': 'Готовы к выдаче', 'st.empty': 'Пусто',
      'st.now': 'только что', 'st.min': '{n} мин назад', 'st.club': '[[star]] Клуб', 'st.bonuspaid': 'Бонусами оплачено: {n} ₸',
      'st.paidonline': '[[check]] Оплачено онлайн', 'st.takecash': '[[banknote]] Принять на кассе: {n} ₸',
      'st.act.new': 'Взять в работу', 'st.act.preparing': 'Готов', 'st.act.ready': 'Выдан', 'st.cancel': 'Отменить', 'st.confirmcancel': 'Отменить заказ?',
      // аналитика
      'ad.tab': 'Аналитика — DrinkStar', 'ad.login': 'Аналитика', 'ad.title': '[[star]] Аналитика',
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
      'cart.free': '[[star]] тегін', 'cart.where': 'Қайдан аласыз', 'cart.choose': 'Кофеханаңызды таңдаңыз', 'cart.until': '{t} дейін', 'cart.closed': 'жабық',
      'cart.name': 'Аты', 'cart.phone': 'Телефон', 'cart.comment': 'Пікір', 'cart.commentPh': 'Мысалы: қантсыз',
      'cart.total': 'Барлығы', 'cart.topay': 'Төленетіні', 'cart.sum': 'Сома', 'cart.bonuses': 'Бонуспен',
      'cart.online': 'Онлайн төлеу', 'cart.cash': 'Кассада', 'cart.cashsub': 'алған кезде',
      'cart.pickup': 'Өзіңіз алып кетесіз', 'cart.pickupcash': 'Өзіңіз алып кетесіз. Төлем алу кезінде кассада',
      'cart.submit': 'Тапсырыс беру · {sum}', 'cart.sending': 'Жіберілуде…', 'cart.menufail': 'Мәзір жүктелмеді. Серверді қосыңыз: npm start',
      'cc.member': '[[star]] Клуб · {n} бонус', 'cc.willreturn': 'Тапсырысты алғаннан кейін +{n} бонус қайтарылады', 'cc.keep': 'Әр тапсырыстан бонус жинаңыз',
      'cc.spend': '{n} жұмсау', 'cc.guest': '[[star]] Клуб мүшелеріне', 'cc.guesttext': 'Тапсырыстан {p}% бонус және сироп тегін. Сіз қонақ ретінде тапсырыс беріп жатырсыз.', 'cc.login': 'Кіру',
      'cl.btn': '[[star]] Клубқа кіру', 'cl.short': 'Клуб', 'cl.hello': 'Сәлем, {name}!', 'cl.guestname': 'клуб қонағы', 'cl.bonuses': 'бонус', 'cl.rate': '1 бонус = 1 ₸',
      'cl.perk1': '[[star]] әр тапсырыстан {p}% бонус болып қайтады', 'cl.perk2': '[[star]] Кез келген сусынға сироп тегін', 'cl.perk3': '[[star]] Тапсырыстың {p}% дейінгі бөлігін бонуспен төлеуге болады',
      'cl.perk1s': '[[star]] әр тапсырыстан {p}% бонус', 'cl.perk2s': '[[star]] Сусынға сироп тегін', 'cl.perk3s': '[[star]] Тапсырыстың {p}% дейінгі бөлігін бонуспен төлеңіз',
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
      'tr.pay': '{sum} төлеу', 'tr.paidonline': '[[check]] Онлайн төленді', 'tr.paycash': 'Төлем алу кезінде кассада', 'tr.bonuspaid': 'Бонуспен төленді',
      'tr.bonusdone': '[[star]] Осы тапсырыс үшін бонус есептелді', 'tr.bonussoon': '[[star]] Тапсырысты алғаннан кейін +{n} бонус', 'tr.home': '← Басты бетке',
      'tr.say': '[[coffee]] Кассада {n} нөмірін айтыңыз', 'tr.notfound': 'Тапсырыс табылмады.', 'tr.nonumber': 'Тапсырыс нөмірі жоқ.', 'tr.ready.title': '[[coffee]] Тапсырыс дайын!',
      'pm.title': 'Тапсырысты төлеу — DrinkStar', 'pm.demo': 'Демо-төлем', 'pm.h1': 'Тапсырысты төлеу', 'pm.card': 'Карта нөмірі', 'pm.exp': 'Мерзімі', 'pm.pay': 'Төлеу',
      'pm.processing': 'Өңделуде…', 'pm.note': 'Бұл — көрсетілім. Ақша алынбайды. Нақты нұсқада мұнда банктің беті ашылады.',
      'pm.order': '№{n} тапсырыс · {loc}', 'pm.nf': 'Тапсырыс табылмады', 'pm.fail': 'Төлемді жүргізу мүмкін болмады',
      'lg.consent.club': '<a href="legal.html?doc=privacy" target="_blank">Құпиялылық саясатын</a> және <a href="legal.html?doc=club" target="_blank">Клуб ережелерін</a> қабылдаймын және дербес деректерімді өңдеуге келісім беремін',
      'lg.consent.order': '<a href="legal.html?doc=terms" target="_blank">Жария офертаны</a> және <a href="legal.html?doc=privacy" target="_blank">Құпиялылық саясатын</a> қабылдаймын, дербес деректерді өңдеуге келісім беремін',
      'lg.marketing': 'Акциялар мен жаңалықтарды алғым келеді (міндетті емес)', 'lg.needconsent': 'Құсбелгі қою арқылы келісімді растаңыз',
      'lg.delete': 'Деректерімді жою', 'lg.deleteconfirm': 'Есептік жазба мен дербес деректер жойылсын ба? Бонустар жойылады. Мұны қайтару мүмкін емес.', 'lg.deleted': 'Деректеріңіз жойылды',
      'lg.privacy': 'Құпиялылық саясаты', 'lg.terms': 'Жария оферта', 'lg.club': 'Клуб ережелері', 'lg.bin': 'БСН', 'lg.companyph': '[ұйым атауы, БСН, мекенжай]',
      'snd.new': 'Жаңа тапсырыс, нөмірі {n}', 'snd.readyself': 'Сіздің {n} нөмірлі тапсырысыңыз дайын, алуға болады',
      'st.pinhint': 'Жеке PIN', 'st.chooseloc': 'Кофеханаңызды таңдаңыз', 'st.manager.all': 'Барлық кофеханалар (менеджер)', 'st.toomany': 'Әрекет тым көп. 5 минут күтіңіз.',
      'st.hello': 'Сәлем, {name}', 'st.shiftsince': 'Ауысым {t} бастап', 'st.handled': 'Ауысымда берілді: {n}', 'st.endshift': 'Ауысымды тапсыру',
      'st.voiceon': '[[volume-2]] Дауыс', 'st.voiceoff': '[[volume-x]] Дауыссыз', 'st.acceptedby': 'Қабылдады: {name}', 'st.readyby': 'Дайындады: {name}',
      'st.role.manager': 'Менеджер', 'st.role.barista': 'Бариста', 'st.sessionend': 'Ауысым аяқталды. Қайта кіріңіз.', 'st.tapsound': 'Дыбысты қосу үшін экранды басыңыз', 'st.loginloc': 'Бүгін қайда жұмыс істейсіз',
      'nav.reviews': 'Пікірлер', 'rv.eyebrow': 'Пікірлер', 'rv.heading': 'Қонақтар не дейді', 'rv.lead': 'Тапсырысты алғаннан кейінгі қонақтардың бағалары',
      'rv.count': 'Пікір саны: {n}', 'rv.empty': 'Әзірге пікір жоқ. Тапсырысыңыздан кейін алғашқысын қалдырыңыз.', 'rv.more': 'Тағы көрсету', 'rv.replyby': 'DrinkStar жауабы', 'rv.avg': 'орташа баға',
      'rv.title': 'Тапсырысты бағалаңыз', 'rv.sub': 'Сіздің пікіріңіз жақсаруға көмектеседі', 'rv.placeholder': 'Не ұнады, нені жақсарту керек? (міндетті емес)', 'rv.nameNote': 'Сайтта тек атыңыз көрсетіледі',
      'rv.send': 'Пікір жіберу', 'rv.thanks': 'Пікіріңіз үшін рахмет!', 'rv.yours': 'Сіздің пікіріңіз', 'rv.reply': 'Кофехана жауабы', 'rv.pickrating': 'Баға қойыңыз',
      'tr.sound.off': 'Хабарландыру дыбысын қосу', 'tr.sound.on': 'Дыбыс қосулы', 'tr.sound.hint': 'Тапсырыс дайын болғанда сигнал беріледі. Бетті ашық қалдырыңыз.', 'tr.sound.tap': 'Дыбысты қосу үшін экранды басыңыз',
      'ad.tab.stats': 'Аналитика', 'ad.tab.staff': 'Қызметкерлер', 'ad.tab.reviews': 'Пікірлер', 'ad.rating': 'Орташа баға', 'ad.rating.s': 'пікір саны: {n}',
      'ad.bybarista': 'Бариста бойынша', 'ad.avgmin': 'орта есеппен {n} мин дайын болғанға дейін',
      'sf.title': 'Қызметкерлер және ауысымдар', 'sf.add': 'Қызметкер қосу', 'sf.name': 'Аты', 'sf.role': 'Рөлі', 'sf.barista': 'Бариста', 'sf.manager': 'Менеджер',
      'sf.pin': 'PIN (міндетті емес, болмаса өзіміз жасаймыз)', 'sf.create': 'Жасау', 'sf.pinis': '{name} қызметкерінің PIN-і: {pin}. Жазып алып, жеке беріңіз, кейін көрсетілмейді.',
      'sf.onshift': 'ауысымда', 'sf.offshift': 'ауысымда емес', 'sf.lastshift': 'соңғы ауысым', 'sf.never': 'әлі шыққан жоқ', 'sf.handled': '30 күнде: {n}',
      'sf.reset': 'Жаңа PIN', 'sf.deactivate': 'Өшіру', 'sf.activate': 'Қосу', 'sf.inactive': 'өшірулі', 'sf.confirmreset': 'Жаңа PIN берілсін бе? Ескісі жұмыс істемейді.',
      'sf.shifts': '7 күндегі ауысымдар', 'sf.col.staff': 'Қызметкер', 'sf.col.loc': 'Кофехана', 'sf.col.start': 'Басталуы', 'sf.col.end': 'Аяқталуы', 'sf.col.orders': 'Тапсырыс', 'sf.ongoing': 'жүріп жатыр', 'sf.allloc': 'Барлық кофеханалар',
      'rw.title': 'Қонақтар пікірлері', 'rw.hide': 'Жасыру', 'rw.show': 'Көрсету', 'rw.reply': 'Иесінің жауабы', 'rw.replyph': 'Қонақтар сайтта көретін жауап', 'rw.save': 'Жауапты сақтау', 'rw.hidden': 'жасырылған', 'rw.order': '№{n} тапсырыс', 'rw.none': 'Әзірге пікір жоқ.',
      'st.tab': 'Тапсырыстар — DrinkStar', 'st.login': 'Қызметкерлер', 'st.pin': 'PIN', 'st.enter': 'Кіру', 'st.badpin': 'PIN дұрыс емес',
      'st.title': '[[star]] Тапсырыстар', 'st.online': 'онлайн', 'st.offline': 'байланыс жоқ', 'st.all': 'Барлық кофеханалар',
      'st.sound': '[[bell]] Дыбыс', 'st.mute': '[[bell-off]] Дыбыссыз', 'st.logout': 'Шығу',
      'st.col.new': 'Жаңа', 'st.col.preparing': 'Дайындалуда', 'st.col.ready': 'Беруге дайын', 'st.empty': 'Бос',
      'st.now': 'жаңа ғана', 'st.min': '{n} мин бұрын', 'st.club': '[[star]] Клуб', 'st.bonuspaid': 'Бонуспен төленді: {n} ₸',
      'st.paidonline': '[[check]] Онлайн төленген', 'st.takecash': '[[banknote]] Кассада қабылдау: {n} ₸',
      'st.act.new': 'Жұмысқа алу', 'st.act.preparing': 'Дайын', 'st.act.ready': 'Берілді', 'st.cancel': 'Бас тарту', 'st.confirmcancel': 'Тапсырыстан бас тартасыз ба?',
      'ad.tab': 'Аналитика — DrinkStar', 'ad.login': 'Аналитика', 'ad.title': '[[star]] Аналитика',
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
      'cart.free': '[[star]] free', 'cart.where': 'Pick up at', 'cart.choose': 'Choose a coffee shop', 'cart.until': 'until {t}', 'cart.closed': 'closed',
      'cart.name': 'Name', 'cart.phone': 'Phone', 'cart.comment': 'Comment', 'cart.commentPh': 'E.g. no sugar',
      'cart.total': 'Total', 'cart.topay': 'To pay', 'cart.sum': 'Subtotal', 'cart.bonuses': 'Bonuses',
      'cart.online': 'Pay online', 'cart.cash': 'At the counter', 'cart.cashsub': 'on pickup',
      'cart.pickup': 'Pickup order', 'cart.pickupcash': 'Pickup order. Pay at the counter when you collect it',
      'cart.submit': 'Place order · {sum}', 'cart.sending': 'Sending…', 'cart.menufail': 'Could not load the menu. Start the server: npm start',
      'cc.member': '[[star]] Club · {n} bonuses', 'cc.willreturn': '+{n} bonuses will be added after you pick up the order', 'cc.keep': 'Earn bonuses with every order',
      'cc.spend': 'Use {n}', 'cc.guest': '[[star]] For club members', 'cc.guesttext': '{p}% back in bonuses and free syrup. You are ordering as a guest.', 'cc.login': 'Sign in',
      'cl.btn': '[[star]] Join the club', 'cl.short': 'Club', 'cl.hello': 'Hi, {name}!', 'cl.guestname': 'club guest', 'cl.bonuses': 'bonuses', 'cl.rate': '1 bonus = 1 ₸',
      'cl.perk1': '[[star]] {p}% of every order comes back as bonuses', 'cl.perk2': '[[star]] Syrup with any drink is free', 'cl.perk3': '[[star]] Pay up to {p}% of an order with bonuses',
      'cl.perk1s': '[[star]] {p}% back in bonuses on every order', 'cl.perk2s': '[[star]] Free syrup with your drink', 'cl.perk3s': '[[star]] Pay up to {p}% of an order with bonuses',
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
      'tr.pay': 'Pay {sum}', 'tr.paidonline': '[[check]] Paid online', 'tr.paycash': 'Pay at the counter on pickup', 'tr.bonuspaid': 'Paid with bonuses',
      'tr.bonusdone': '[[star]] Bonuses for this order have been added', 'tr.bonussoon': '[[star]] +{n} bonuses after you pick up the order', 'tr.home': '← Back to home',
      'tr.say': '[[coffee]] Tell the counter your number: {n}', 'tr.notfound': 'Order not found.', 'tr.nonumber': 'No order number.', 'tr.ready.title': '[[coffee]] Your order is ready!',
      'pm.title': 'Pay for your order — DrinkStar', 'pm.demo': 'Demo payment', 'pm.h1': 'Pay for your order', 'pm.card': 'Card number', 'pm.exp': 'Expires', 'pm.pay': 'Pay',
      'pm.processing': 'Processing…', 'pm.note': 'This is a demo. No money is charged. In the live version the bank page opens here.',
      'pm.order': 'Order #{n} · {loc}', 'pm.nf': 'Order not found', 'pm.fail': 'Could not process the payment',
      'lg.consent.club': 'I accept the <a href="legal.html?doc=privacy" target="_blank">Privacy Policy</a> and the <a href="legal.html?doc=club" target="_blank">Club Rules</a> and consent to the processing of my personal data',
      'lg.consent.order': 'I accept the <a href="legal.html?doc=terms" target="_blank">Public Offer</a> and the <a href="legal.html?doc=privacy" target="_blank">Privacy Policy</a> and consent to the processing of my personal data',
      'lg.marketing': 'I would like to receive offers and news (optional)', 'lg.needconsent': 'Please tick the checkbox to confirm your consent',
      'lg.delete': 'Delete my data', 'lg.deleteconfirm': 'Delete your account and personal data? Your bonuses will be cancelled. This cannot be undone.', 'lg.deleted': 'Your data has been deleted',
      'lg.privacy': 'Privacy Policy', 'lg.terms': 'Public Offer', 'lg.club': 'Club Rules', 'lg.bin': 'BIN', 'lg.companyph': '[organisation name, BIN, address]',
      'snd.new': 'New order number {n}', 'snd.readyself': 'Your order number {n} is ready for pickup',
      'st.pinhint': 'Personal PIN', 'st.chooseloc': 'Choose a coffee shop', 'st.manager.all': 'All coffee shops (manager)', 'st.toomany': 'Too many attempts. Wait 5 minutes.',
      'st.hello': 'Hi, {name}', 'st.shiftsince': 'Shift since {t}', 'st.handled': 'Handed out this shift: {n}', 'st.endshift': 'End shift',
      'st.voiceon': '[[volume-2]] Voice', 'st.voiceoff': '[[volume-x]] No voice', 'st.acceptedby': 'Accepted by: {name}', 'st.readyby': 'Prepared by: {name}',
      'st.role.manager': 'Manager', 'st.role.barista': 'Barista', 'st.sessionend': 'The shift has ended. Please sign in again.', 'st.tapsound': 'Tap the screen to enable sound', 'st.loginloc': 'Where are you working today',
      'nav.reviews': 'Reviews', 'rv.eyebrow': 'Reviews', 'rv.heading': 'What guests say', 'rv.lead': 'Ratings from guests after they collected their order',
      'rv.count': 'Reviews: {n}', 'rv.empty': 'No reviews yet. Leave the first one after your order.', 'rv.more': 'Show more', 'rv.replyby': 'DrinkStar replied', 'rv.avg': 'average rating',
      'rv.title': 'Rate your order', 'rv.sub': 'Your feedback helps us get better', 'rv.placeholder': 'What did you like, what could be better? (optional)', 'rv.nameNote': 'Only your first name is shown on the site',
      'rv.send': 'Send review', 'rv.thanks': 'Thank you for your review!', 'rv.yours': 'Your review', 'rv.reply': 'Reply from the coffee shop', 'rv.pickrating': 'Please give a rating',
      'tr.sound.off': 'Turn on notification sound', 'tr.sound.on': 'Sound is on', 'tr.sound.hint': 'You will hear a signal when your order is ready. Keep this page open.', 'tr.sound.tap': 'Tap the screen to enable sound',
      'ad.tab.stats': 'Analytics', 'ad.tab.staff': 'Staff', 'ad.tab.reviews': 'Reviews', 'ad.rating': 'Average rating', 'ad.rating.s': 'reviews: {n}',
      'ad.bybarista': 'By barista', 'ad.avgmin': 'avg {n} min to ready',
      'sf.title': 'Staff and shifts', 'sf.add': 'Add a team member', 'sf.name': 'Name', 'sf.role': 'Role', 'sf.barista': 'Barista', 'sf.manager': 'Manager',
      'sf.pin': 'PIN (optional, we will create one if empty)', 'sf.create': 'Create', 'sf.pinis': 'PIN for {name}: {pin}. Write it down and hand it over in person, it will not be shown again.',
      'sf.onshift': 'on shift', 'sf.offshift': 'off shift', 'sf.lastshift': 'last shift', 'sf.never': 'has not worked yet', 'sf.handled': 'last 30 days: {n}',
      'sf.reset': 'New PIN', 'sf.deactivate': 'Disable', 'sf.activate': 'Enable', 'sf.inactive': 'disabled', 'sf.confirmreset': 'Issue a new PIN? The old one will stop working.',
      'sf.shifts': 'Shifts in the last 7 days', 'sf.col.staff': 'Team member', 'sf.col.loc': 'Coffee shop', 'sf.col.start': 'Start', 'sf.col.end': 'End', 'sf.col.orders': 'Orders', 'sf.ongoing': 'in progress', 'sf.allloc': 'All coffee shops',
      'rw.title': 'Guest reviews', 'rw.hide': 'Hide', 'rw.show': 'Show', 'rw.reply': 'Owner reply', 'rw.replyph': 'A reply that guests will see on the site', 'rw.save': 'Save reply', 'rw.hidden': 'hidden', 'rw.order': 'order #{n}', 'rw.none': 'No reviews yet.',
      'st.tab': 'Orders — DrinkStar', 'st.login': 'Staff', 'st.pin': 'PIN', 'st.enter': 'Sign in', 'st.badpin': 'Wrong PIN',
      'st.title': '[[star]] Orders', 'st.online': 'online', 'st.offline': 'no connection', 'st.all': 'All coffee shops',
      'st.sound': '[[bell]] Sound', 'st.mute': '[[bell-off]] Muted', 'st.logout': 'Sign out',
      'st.col.new': 'New', 'st.col.preparing': 'Preparing', 'st.col.ready': 'Ready for pickup', 'st.empty': 'Empty',
      'st.now': 'just now', 'st.min': '{n} min ago', 'st.club': '[[star]] Club', 'st.bonuspaid': 'Paid with bonuses: {n} ₸',
      'st.paidonline': '[[check]] Paid online', 'st.takecash': '[[banknote]] Take at the counter: {n} ₸',
      'st.act.new': 'Start', 'st.act.preparing': 'Ready', 'st.act.ready': 'Collected', 'st.cancel': 'Cancel', 'st.confirmcancel': 'Cancel this order?',
      'ad.tab': 'Analytics — DrinkStar', 'ad.login': 'Analytics', 'ad.title': '[[star]] Analytics',
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

  const RAW = (key, vars) => {
    let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.ru[key] ?? key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };
  // t(): с иконками (для innerHTML); tp(): обычный текст (для textContent, title, confirm, placeholder)
  const TOKEN = /\[\[([\w-]+)\]\]/g;
  const t = (key, vars) => RAW(key, vars).replace(TOKEN, (m, n) => (window.ic ? window.ic(n) : ''));
  const GLYPH = { star: '★', check: '✓' };
  const tp = (key, vars) => RAW(key, vars).replace(TOKEN, (m, n) => GLYPH[n] || '').replace(/^\s+/, '');
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
    document.querySelectorAll('[data-i18n]').forEach(el => { const s = t(el.dataset.i18n); if (s.indexOf('<svg') >= 0) el.innerHTML = s; else el.textContent = s; });
    if (window.icInit) window.icInit();
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPh)));
    if (document.documentElement.dataset.title) document.title = tp(document.documentElement.dataset.title);
    document.querySelectorAll('.lang').forEach(box => {
      box.innerHTML = LANGS.map(l => `<button type="button" class="${l === LANG ? 'on' : ''}" data-lang="${l}" aria-label="${LABEL[l]}">${LABEL[l]}</button>`).join('');
      box.onclick = e => { const b = e.target.closest('[data-lang]'); if (b && b.dataset.lang !== LANG) setLang(b.dataset.lang); };
    });
  }
  window.I18N = { LANG, LOCALE: LOCALE[LANG], t, tr, num, setLang, applyStatic };
  window.t = t; window.tp = tp; window.tr = tr;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyStatic); else applyStatic();
})();
