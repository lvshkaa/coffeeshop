// Тексты юридических документов (шаблоны). Реквизиты подставляются из data/company.json,
// проценты клуба из data/club.json. Перед боевым запуском документы должен проверить юрист.
// Структура: LEGAL[документ][язык] = { title, sections: [[заголовок, [абзацы]], ...] }
window.LEGAL = {
  privacy: {
    ru: {
      title: 'Политика конфиденциальности',
      sections: [
        ['Общие положения', [
          'Настоящая политика описывает, как {company} (БИН {bin}, {address}; далее — «Организатор») собирает, использует и защищает персональные данные посетителей сайта DrinkStar Coffee&more. Политика составлена в соответствии с законодательством Республики Казахстан о персональных данных и их защите.',
          'Пользуясь сайтом, оформляя заказ или входя в клуб, вы подтверждаете, что ознакомились с настоящей политикой.']],
        ['Какие данные мы собираем', [
          'Имя и номер телефона, которые вы указываете при заказе или входе в клуб.',
          'История ваших заказов, бонусный баланс и операции по бонусам (для участников клуба).',
          'Комментарии, которые вы пишете к заказам.',
          'Технические данные: IP-адрес и сведения о запросах в журналах сервера, для безопасности и защиты от злоупотреблений.',
          'Мы не собираем и не храним данные ваших банковских карт: онлайн-оплата проходит на стороне платёжного провайдера.']],
        ['Для чего мы используем данные', [
          'Принять и выдать заказ, связаться с вами по заказу.',
          'Вход в клуб по коду из SMS, учёт и начисление бонусов.',
          'Защита сайта от мошенничества и сбоев.',
          'Улучшение работы кофеен на основе обезличенной статистики.',
          'Рекламные сообщения отправляются только если вы отдельно на это согласились.']],
        ['Основание обработки', [
          'Мы обрабатываем данные на основании вашего согласия, которое вы даёте, отметив соответствующую галочку на сайте. Версия документов на момент согласия сохраняется ({version}).']],
        ['Передача третьим лицам', [
          'Мы не продаём персональные данные. Для работы сервиса данные могут передаваться платёжному провайдеру (для оплаты), оператору SMS (для отправки кода) и поставщику хостинга (для хранения). Эти лица обрабатывают данные только в объёме, необходимом для оказания услуг.',
          'Место хранения данных: {storage}.']],
        ['Сроки хранения', [
          'Данные участника клуба хранятся, пока действует его учётная запись. Сведения о заказах хранятся в течение срока, необходимого для учёта и разрешения споров. После удаления учётной записи персональные данные удаляются, а в записях о заказах обезличиваются.']],
        ['Ваши права', [
          'Вы вправе получить сведения о своих данных, потребовать их исправления, отозвать согласие и удалить свои данные. Участник клуба может удалить аккаунт и данные кнопкой «Удалить мои данные» в личном кабинете. Остальные запросы направляйте на {email}.']],
        ['Защита данных', [
          'Соединение с сайтом защищено, доступ к данным ограничен, вход в клуб подтверждается кодом из SMS, а коды и сессии хранятся в защищённом виде.']],
        ['Cookie и локальное хранилище', [
          'Сайт сохраняет в вашем браузере выбранный язык, содержимое корзины, введённые данные формы и сессию входа в клуб (до 90 дней). Мы не используем рекламные и отслеживающие cookie. Вы можете очистить сохранённые данные в настройках браузера.']],
        ['Изменения и контакты', [
          'Мы можем обновлять политику, актуальная версия всегда на этой странице. Контакты: {company}, {address}, {phone}, {email}.']]
      ]
    },
    kk: {
      title: 'Құпиялылық саясаты',
      sections: [
        ['Жалпы ережелер', [
          'Осы саясат {company} (БСН {bin}, {address}; бұдан әрі — «Ұйымдастырушы») DrinkStar Coffee&more сайтына келушілердің дербес деректерін қалай жинайтынын, пайдаланатынын және қорғайтынын сипаттайды. Саясат Қазақстан Республикасының дербес деректер және оларды қорғау туралы заңнамасына сәйкес жасалған.',
          'Сайтты пайдалану, тапсырыс беру немесе клубқа кіру арқылы сіз осы саясатпен танысқаныңызды растайсыз.']],
        ['Біз қандай деректерді жинаймыз', [
          'Тапсырыс беру немесе клубқа кіру кезінде көрсететін атыңыз бен телефон нөміріңіз.',
          'Тапсырыстар тарихы, бонус балансы және бонус бойынша операциялар (клуб мүшелері үшін).',
          'Тапсырысқа жазған пікірлеріңіз.',
          'Техникалық деректер: қауіпсіздік және теріс пайдаланудан қорғау үшін сервер журналындағы IP-мекенжай мен сұраныстар туралы мәліметтер.',
          'Біз банк карталарыңыздың деректерін жинамаймыз және сақтамаймыз: онлайн төлем төлем провайдерінің жағында өтеді.']],
        ['Деректерді не үшін қолданамыз', [
          'Тапсырысты қабылдау және беру, тапсырыс бойынша сізбен байланысу.',
          'SMS-тегі код арқылы клубқа кіру, бонустарды есептеу және есепке алу.',
          'Сайтты алаяқтық пен іркілістерден қорғау.',
          'Жасырын статистика негізінде кофеханалар жұмысын жақсарту.',
          'Жарнамалық хабарламалар тек сіз бөлек келіскен жағдайда ғана жіберіледі.']],
        ['Өңдеудің негізі', [
          'Біз деректерді сайтта тиісті құсбелгіні қою арқылы берген келісіміңіз негізінде өңдейміз. Келісім берілген сәттегі құжаттар нұсқасы сақталады ({version}).']],
        ['Үшінші тұлғаларға беру', [
          'Біз дербес деректерді сатпаймыз. Қызмет жұмыс істеуі үшін деректер төлем провайдеріне (төлеу үшін), SMS операторына (код жіберу үшін) және хостинг жеткізушісіне (сақтау үшін) берілуі мүмкін. Бұл тұлғалар деректерді қызмет көрсету үшін қажетті көлемде ғана өңдейді.',
          'Деректерді сақтау орны: {storage}.']],
        ['Сақтау мерзімі', [
          'Клуб мүшесінің деректері оның есептік жазбасы әрекет ететін уақытқа дейін сақталады. Тапсырыстар туралы мәліметтер есепке алу және дауларды шешу үшін қажетті мерзімде сақталады. Есептік жазба жойылғаннан кейін дербес деректер жойылады, ал тапсырыстар жазбаларында жекелендірілмейді.']],
        ['Сіздің құқықтарыңыз', [
          'Сіз өз деректеріңіз туралы мәлімет алуға, оларды түзетуді талап етуге, келісімді қайтарып алуға және деректеріңізді жоюға құқылысыз. Клуб мүшесі жеке кабинеттегі «Деректерімді жою» түймесімен есептік жазбасы мен деректерін жоя алады. Басқа сұраулар {email} мекенжайына жіберіледі.']],
        ['Деректерді қорғау', [
          'Сайтпен байланыс қорғалған, деректерге қолжетімділік шектелген, клубқа кіру SMS-тегі кодпен расталады, ал кодтар мен сессиялар қорғалған түрде сақталады.']],
        ['Cookie және жергілікті жад', [
          'Сайт браузерде таңдалған тілді, себет мазмұнын, енгізілген форма деректерін және клубқа кіру сессиясын (90 күнге дейін) сақтайды. Біз жарнамалық және бақылау cookie-файлдарын қолданбаймыз. Сақталған деректерді браузер баптауларында тазалай аласыз.']],
        ['Өзгерістер және байланыс', [
          'Біз саясатты жаңарта аламыз, өзекті нұсқасы әрқашан осы бетте. Байланыс: {company}, {address}, {phone}, {email}.']]
      ]
    },
    en: {
      title: 'Privacy Policy',
      sections: [
        ['General provisions', [
          'This policy describes how {company} (BIN {bin}, {address}; the “Operator”) collects, uses and protects the personal data of visitors to the DrinkStar Coffee&more website. It is prepared in line with the personal data protection legislation of the Republic of Kazakhstan.',
          'By using the website, placing an order or signing in to the club, you confirm that you have read this policy.']],
        ['What data we collect', [
          'Your name and phone number, which you provide when ordering or signing in to the club.',
          'Your order history, bonus balance and bonus transactions (for club members).',
          'Comments you write on your orders.',
          'Technical data: IP address and request details in server logs, for security and abuse prevention.',
          'We do not collect or store your bank card details: online payment is processed by the payment provider.']],
        ['Why we use the data', [
          'To accept and hand over your order and to contact you about it.',
          'To sign you in to the club with an SMS code and to record and credit bonuses.',
          'To protect the website from fraud and failures.',
          'To improve our coffee shops based on anonymised statistics.',
          'Marketing messages are sent only if you gave separate consent.']],
        ['Legal basis', [
          'We process data on the basis of your consent, given by ticking the checkbox on the website. The version of the documents at the time of consent is recorded ({version}).']],
        ['Sharing with third parties', [
          'We do not sell personal data. To run the service, data may be shared with the payment provider (for payment), the SMS operator (to send the code) and the hosting provider (for storage). They process data only as needed to provide their services.',
          'Where data is stored: {storage}.']],
        ['Retention', [
          'A club member’s data is kept while the account is active. Order records are kept for as long as needed for accounting and dispute resolution. When an account is deleted, personal data is erased and anonymised in order records.']],
        ['Your rights', [
          'You may request information about your data, ask for corrections, withdraw your consent and delete your data. A club member can delete the account and data with the “Delete my data” button in the personal account. Other requests can be sent to {email}.']],
        ['Data protection', [
          'The connection to the website is secured, access to data is restricted, club sign-in is confirmed by an SMS code, and codes and sessions are stored in protected form.']],
        ['Cookies and local storage', [
          'The website stores in your browser the selected language, the cart contents, form entries and the club sign-in session (up to 90 days). We do not use advertising or tracking cookies. You can clear the stored data in your browser settings.']],
        ['Changes and contacts', [
          'We may update this policy; the current version is always on this page. Contacts: {company}, {address}, {phone}, {email}.']]
      ]
    }
  },

  terms: {
    ru: {
      title: 'Публичная оферта',
      sections: [
        ['Общие положения', [
          'Настоящая публичная оферта определяет условия продажи готовых напитков и продуктов дистанционным способом с самовывозом. Продавец: {company}, БИН {bin}, {address}. Акцептом оферты является оформление заказа на сайте.']],
        ['Оформление заказа', [
          'Заказ оформляется на сайте для самовывоза из выбранной кофейни в часы её работы. Если кофейня закрыта, заказ не принимается. Принятие заказа отражается статусом на странице заказа.']],
        ['Цены', [
          'Цены указаны в тенге и опубликованы на сайте. Сумма заказа рассчитывается на сервере в момент оформления с учётом стоимости добавок.']],
        ['Оплата', [
          'Оплата производится онлайн через платёжного провайдера либо на кассе при получении заказа. Неоплаченный онлайн-заказ отменяется через 15 минут.']],
        ['Получение заказа', [
          'Заказ выдаётся в выбранной кофейне по номеру заказа. Напитки готовятся горячими, поэтому рекомендуем забрать заказ вскоре после готовности.']],
        ['Отмена и возврат', [
          'Чтобы отменить заказ до начала приготовления, обратитесь в кофейню. Готовые продукты питания надлежащего качества возврату не подлежат в соответствии с законодательством о защите прав потребителей. Если оплаченный онлайн заказ отменён, деньги возвращаются тем же способом, которым была произведена оплата.']],
        ['Качество и аллергены', [
          'Информацию об аллергенах уточняйте у бариста. Кофейня не гарантирует отсутствие следов аллергенов в продукции.']],
        ['Ответственность', [
          'Стороны несут ответственность в соответствии с законодательством Республики Казахстан. При обстоятельствах непреодолимой силы стороны освобождаются от ответственности.']],
        ['Персональные данные и клуб', [
          'Персональные данные обрабатываются в соответствии с Политикой конфиденциальности. Условия бонусов описаны в Правилах клуба.']],
        ['Реквизиты и претензии', [
          'Продавец: {company}, БИН {bin}, {address}, {phone}, {email}. Претензии направляются на {email}. К отношениям сторон применяется право Республики Казахстан.']]
      ]
    },
    kk: {
      title: 'Жария оферта',
      sections: [
        ['Жалпы ережелер', [
          'Осы жария оферта дайын сусындар мен өнімдерді қашықтан, өзі алып кету арқылы сату шарттарын белгілейді. Сатушы: {company}, БСН {bin}, {address}. Офертаны акцепттеу — сайтта тапсырыс беру.']],
        ['Тапсырыс беру', [
          'Тапсырыс сайт арқылы таңдалған кофеханадан оның жұмыс уақытында өзі алып кету үшін беріледі. Кофехана жабық болса, тапсырыс қабылданбайды. Тапсырыстың қабылданғаны тапсырыс бетіндегі мәртебеден көрінеді.']],
        ['Бағалар', [
          'Бағалар теңгемен көрсетіліп, сайтта жарияланады. Тапсырыс сомасы тапсырыс берген сәтте серверде есептеледі, қосымшалардың бағасы ескеріледі.']],
        ['Төлем', [
          'Төлем онлайн (төлем провайдері арқылы) немесе тапсырысты алған кезде кассада жүргізіледі. Төленбеген онлайн-тапсырыстан 15 минуттан кейін бас тартылады.']],
        ['Тапсырысты алу', [
          'Тапсырыс таңдалған кофеханада тапсырыс нөмірі бойынша беріледі. Сусындар ыстық дайындалатындықтан, дайын болған соң тезірек алуды ұсынамыз.']],
        ['Бас тарту және қайтару', [
          'Дайындау басталғанға дейін тапсырыстан бас тарту үшін кофеханаға хабарласыңыз. Тиісті сапалы дайын тағам өнімдері тұтынушылардың құқықтарын қорғау туралы заңнамаға сәйкес қайтарылмайды. Онлайн төленген тапсырыстан бас тартылса, ақша төлем жасалған тәсілмен қайтарылады.']],
        ['Сапа және аллергендер', [
          'Аллергендер туралы ақпаратты баристадан нақтылаңыз. Кофехана өнімдерде аллерген іздерінің болмауына кепілдік бермейді.']],
        ['Жауапкершілік', [
          'Тараптар Қазақстан Республикасының заңнамасына сәйкес жауап береді. Еңсерілмейтін күш жағдайында тараптар жауапкершіліктен босатылады.']],
        ['Дербес деректер және клуб', [
          'Дербес деректер Құпиялылық саясатына сәйкес өңделеді. Бонустар шарттары Клуб ережелерінде сипатталған.']],
        ['Реквизиттер және талаптар', [
          'Сатушы: {company}, БСН {bin}, {address}, {phone}, {email}. Талаптар {email} мекенжайына жіберіледі. Тараптардың қатынастарына Қазақстан Республикасының құқығы қолданылады.']]
      ]
    },
    en: {
      title: 'Public Offer',
      sections: [
        ['General provisions', [
          'This public offer sets out the terms for the remote sale of ready-made drinks and food with pickup. Seller: {company}, BIN {bin}, {address}. Placing an order on the website constitutes acceptance of this offer.']],
        ['Placing an order', [
          'Orders are placed on the website for pickup from the selected coffee shop during its opening hours. If the coffee shop is closed, the order is not accepted. Acceptance is shown by the status on the order page.']],
        ['Prices', [
          'Prices are in tenge and published on the website. The order total is calculated on the server when you place the order, including the price of add-ons.']],
        ['Payment', [
          'Payment is made online through the payment provider or at the counter on pickup. An unpaid online order is cancelled after 15 minutes.']],
        ['Pickup', [
          'The order is handed over at the selected coffee shop by order number. Drinks are made hot, so please collect your order soon after it is ready.']],
        ['Cancellation and refunds', [
          'To cancel an order before preparation starts, contact the coffee shop. Ready-made food of proper quality cannot be returned, in accordance with consumer protection legislation. If an order paid online is cancelled, the money is returned by the same method used for payment.']],
        ['Quality and allergens', [
          'Please ask the barista about allergens. The coffee shop does not guarantee that products are free from traces of allergens.']],
        ['Liability', [
          'The parties are liable in accordance with the legislation of the Republic of Kazakhstan. In case of force majeure the parties are released from liability.']],
        ['Personal data and the club', [
          'Personal data is processed in accordance with the Privacy Policy. Bonus terms are described in the Club Rules.']],
        ['Details and claims', [
          'Seller: {company}, BIN {bin}, {address}, {phone}, {email}. Claims should be sent to {email}. The law of the Republic of Kazakhstan applies to the relationship between the parties.']]
      ]
    }
  },

  club: {
    ru: {
      title: 'Правила клуба DrinkStar Club',
      sections: [
        ['Что такое клуб', [
          'DrinkStar Club — программа лояльности {company} (далее — «Организатор»). Участие бесплатное и добровольное.']],
        ['Вступление', [
          'Вход в клуб выполняется по номеру телефона и коду из SMS. Новый номер сразу становится участником клуба. Входя в клуб, вы принимаете настоящие Правила и Политику конфиденциальности.']],
        ['Начисление бонусов', [
          'С суммы заказа, оплаченной деньгами (после вычета бонусов), {p}% возвращается бонусами. Бонусы начисляются после выдачи заказа. 1 бонус = 1 ₸. За отменённые заказы бонусы не начисляются.']],
        ['Списание бонусов', [
          'Бонусами можно оплатить до {m}% стоимости заказа. Бонусы нельзя обменять на деньги или передать другому лицу.']],
        ['Бесплатный сироп', [
          'При заказе через сайт участнику клуба сироп к любому напитку предоставляется бесплатно.']],
        ['Отмена заказа', [
          'Если заказ отменён или не оплачен, списанные бонусы возвращаются, а начисленные за него аннулируются.']],
        ['Срок действия и изменения', [
          'Бонусы не сгорают, пока учётная запись активна. Организатор вправе изменить настоящие Правила, опубликовав новую версию на сайте. Накопленные бонусы при этом сохраняются.']],
        ['Злоупотребления', [
          'При подозрении на мошенничество Организатор вправе аннулировать бонусы и закрыть учётную запись.']],
        ['Выход и удаление данных', [
          'Вы можете выйти из клуба кнопкой «Удалить мои данные» в личном кабинете. При этом накопленные бонусы аннулируются.']],
        ['Контакты', [
          '{company}, {address}, {phone}, {email}.']]
      ]
    },
    kk: {
      title: 'DrinkStar Club ережелері',
      sections: [
        ['Клуб деген не', [
          'DrinkStar Club — {company} (бұдан әрі — «Ұйымдастырушы») адалдық бағдарламасы. Қатысу тегін әрі ерікті.']],
        ['Қосылу', [
          'Клубқа телефон нөмірі мен SMS-тегі код арқылы кіресіз. Жаңа нөмір бірден клуб мүшесі болады. Клубқа кіру арқылы сіз осы Ережелермен және Құпиялылық саясатымен келісесіз.']],
        ['Бонустарды есептеу', [
          'Ақшамен төленген тапсырыс сомасынан (бонустарды шегергеннен кейін) {p}% бонус болып қайтарылады. Бонустар тапсырыс берілгеннен кейін есептеледі. 1 бонус = 1 ₸. Бас тартылған тапсырыстар үшін бонус есептелмейді.']],
        ['Бонустарды жұмсау', [
          'Бонуспен тапсырыс құнының {m}% дейінін төлеуге болады. Бонустарды ақшаға айырбастауға немесе басқа адамға беруге болмайды.']],
        ['Тегін сироп', [
          'Сайт арқылы тапсырыс бергенде клуб мүшесіне кез келген сусынға сироп тегін беріледі.']],
        ['Тапсырыстан бас тарту', [
          'Тапсырыстан бас тартылса немесе ол төленбесе, жұмсалған бонустар қайтарылады, ал осы тапсырыс үшін есептелгендері жойылады.']],
        ['Мерзімі және өзгерістер', [
          'Есептік жазба белсенді болғанда бонустар жанбайды. Ұйымдастырушы осы Ережелердің жаңа нұсқасын сайтта жариялау арқылы оларды өзгертуге құқылы. Жинақталған бонустар сақталады.']],
        ['Теріс пайдалану', [
          'Алаяқтық күдігі болса, Ұйымдастырушы бонустарды жоюға және есептік жазбаны жабуға құқылы.']],
        ['Шығу және деректерді жою', [
          'Жеке кабинеттегі «Деректерімді жою» түймесімен клубтан шыға аласыз. Бұл жағдайда жинақталған бонустар жойылады.']],
        ['Байланыс', [
          '{company}, {address}, {phone}, {email}.']]
      ]
    },
    en: {
      title: 'DrinkStar Club Rules',
      sections: [
        ['What the club is', [
          'DrinkStar Club is the loyalty program of {company} (the “Operator”). Participation is free and voluntary.']],
        ['Joining', [
          'You sign in to the club with your phone number and an SMS code. A new number becomes a club member right away. By signing in you accept these Rules and the Privacy Policy.']],
        ['Earning bonuses', [
          '{p}% of the part of an order paid in money (after bonuses are deducted) is returned as bonuses. Bonuses are credited after the order is handed over. 1 bonus = 1 ₸. No bonuses are credited for cancelled orders.']],
        ['Spending bonuses', [
          'You can pay up to {m}% of an order with bonuses. Bonuses cannot be exchanged for cash or transferred to another person.']],
        ['Free syrup', [
          'When ordering through the website, club members get syrup with any drink for free.']],
        ['Order cancellation', [
          'If an order is cancelled or not paid, the bonuses spent on it are returned and the bonuses earned for it are cancelled.']],
        ['Validity and changes', [
          'Bonuses do not expire while the account is active. The Operator may change these Rules by publishing a new version on the website. Bonuses already earned are kept.']],
        ['Abuse', [
          'If fraud is suspected, the Operator may cancel bonuses and close the account.']],
        ['Leaving and deleting data', [
          'You can leave the club with the “Delete my data” button in your personal account. Accumulated bonuses are cancelled in that case.']],
        ['Contacts', [
          '{company}, {address}, {phone}, {email}.']]
      ]
    }
  }
};
