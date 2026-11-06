// Карта Renderforest. Только данные: ядро её читает, кода здесь нет. Элементы ищутся по видимому тексту,
// aria-label, data-testid, data-qa и простым классам из исходников мастера (download-button и т. п.):
// классы вида Name-sc-xxxx генерируются и меняются. Тексты на английском и русском: язык сайта у людей разный.
// Сверено с живым Renderforest 05.11.2026 (мастер ai-flow-spa 1.6.7).
//
// Шаги — по инструкции на сайте тренажёра (data/mayak-service-templates/renderforest.pptx): регистрация через
// Google → "Видео Шаблоны" → "Начните с ИИ" (мастер gen-ai-flow?mode=ai_template_animation, 4 шага) → промт →
// способ "Реалистичный со стоковыми кадрами" → бесплатный стиль → "Загрузить" (720p с водяным знаком).
// Способ в инструкции один, поэтому выбора режима нет.
// "Длинное ИИ Видео" (/home/gen-ai-flow) не годится: бесплатно там только первые секунды в 480p.
// title: подпись у курсора, коротко, что сделать; say: пояснение в капсуле, не длиннее 60 знаков.
(window.MAYAK_MAPS ||= []).push({
  service: 'renderforest',
  name: 'Renderforest',
  hosts: ['renderforest.com', 'accounts.google.com'],
  home: 'renderforest.com',

  elements: {
    // сайт-витрина
    language: { css: 'button[aria-label="Accept language"]' }, // плашка "Хотите изменить язык на русский?"
    register: { css: 'button[aria-label="Регистрация"], button[aria-label="Try for Free"]' },
    google: { css: 'button[data-qa="google-auth-btn"]' }, // на страницах входа, регистрации и в окне регистрации
    // аватар, когда вход выполнен; в тексте кнопки ещё скрытое меню с именем и почтой
    account: { css: 'button[aria-label]', text: '^(мой аккаунт|my account)( |$)' },
    logo: { css: 'a[href$="/home/main"]', text: 'renderforest' }, // после входа логотип ведёт в кабинет
    gAccount: { css: '[data-identifier]' },
    gEmail: { css: 'input[name=identifier], input[type=email]' },
    gPassword: { css: 'input[name=Passwd], input[type=password]' },
    gNext: { css: 'button', text: '^(далее|next)$' },
    gContinue: { css: 'button', text: '^(продолжить|continue)$' },
    // кабинет (при входе сюда же ведёт и корень renderforest.com)
    templatesNav: { css: 'a[data-testid="sidebar-menu-templates"]' },
    templatesCard: { css: 'a[href*="/home/templates/videos?"]' }, // карточка "Видео Шаблоны" на главной кабинета
    // сама ссылка без размеров, обводится её карточка
    startAi: { css: 'div:has(> a[href*="ai_template_animation"])' },
    // мастер, шаг 1 из 4
    promoClose: { css: '.popup-content > svg' }, // крестик рекламы "Turn any URL into a Video"
    // предложение подписки со скидкой; русский текст кнопки не видели, второй вариант — догадка
    continueFree: { css: 'button', text: '^(continue with free|продолжить бесплатно)$' },
    prompt: { css: 'textarea' },
    next: { css: 'div:has(> p)', text: '^(next|далее)$' },
    // шаг 2: способ ("Выберите тип шаблона" или, в старом виде, "Выберите способ"); нажатие сразу ведёт дальше
    realistic: { css: '[data-testid$="option-realistic"]' },
    // шаг 3: сетка стилей идёт сразу за подписью "Стиль", первая карточка "Выбор ИИ"
    styles: { css: 'div:has(> p[type="h1"]) + div', text: '^(ai choice|выбор ии)' },
    // карточка "Выбор ИИ" в сетке: курсор на сетке целиком попадал на случайную, бывало платную
    aiChoice: { css: 'div:has(> p[type="title"])', text: '^(ai choice|выбор ии)$' },
    generate: { css: 'div:has(> p)', text: '^(generate|генерировать) ?\\d*$' },
    // генерация и результат
    busy: { css: 'p, div:not(:has(div))', text: '^(video generation is temporarily unavailable|генерация видео временно недоступна)' },
    loading: { css: 'div:not(:has(div))', text: '^(hold tight|держитесь крепче)' },
    download: { css: '.download-button' },
    // Окно "Настройки загрузки" само выбирает платные 1080p и "без водяного знака", кнопка тогда "Обновить"
    // (оплата). Бесплатно — 720p и водяной знак, кнопка становится "Загрузить".
    dlButton: { css: '.download-popup-primary' },
    dlUpgrade: { css: '.download-popup-primary', text: '^(upgrade|обновить)$' },
    dlSave: { css: '.download-popup-primary', text: '^(download|загрузить)$' },
    q720: { css: '.quality-option', text: '^720p$' },
    watermark: { css: '.download-watermark-option', text: '^(renderforest watermark|водяной знак renderforest)$' },
  },

  stages: [
    { id: 'login', title: 'Вход' },
    { id: 'create', title: 'Создание' },
    { id: 'result', title: 'Результат' },
  ],

  // Шаги узнаются по странице: у каждого skip, пока его элемента нет. Иначе ядро покажет первый шаг без skip
  // на любой странице, где всё до него пропущено. До шага стиля шаги и без "выполнено": реклама
  // и предложение подписки всплывают в любой момент, а шаги до последнего выполненного ядро не показывает.
  intro: [
    { id: 'language', stage: 'login', el: 'language',
      skip: { not: { exists: 'language' } },
      title: 'Нажмите ИЗМЕНИТЬ',
      say: 'Renderforest перейдёт на русский язык.' },
    { id: 'register', stage: 'login', el: 'register',
      skip: { any: [{ not: { exists: 'register' } }, { exists: 'google' }] },
      title: 'Нажмите Регистрация',
      say: 'Уже есть аккаунт? Тогда Войти, рядом.' },
    { id: 'google', stage: 'login', el: 'google',
      skip: { not: { exists: 'google' } },
      title: 'Нажмите Google',
      say: 'Вход через Google: отдельный пароль не нужен.' },
    // Страницы Google: шаг виден, только если человек пришёл из Renderforest (нажал Google за последние
    // 15 минут). Последний шаг без цели — запасной для всего, что Google покажет ещё.
    { id: 'g-account', stage: 'login', host: 'accounts.google.com', el: 'gAccount',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gAccount' } }] },
      title: 'Нажмите свой аккаунт',
      say: 'Аккаунт Google, через который входите в Renderforest.' },
    { id: 'g-email', stage: 'login', host: 'accounts.google.com', el: 'gEmail',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gEmail' } }, { filled: 'gEmail' }] },
      title: 'Введите почту Gmail',
      say: 'Адрес почты, например ivanov@gmail.com.' },
    { id: 'g-email-next', stage: 'login', host: 'accounts.google.com', el: 'gNext',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gEmail' } }] },
      title: 'Нажмите Далее',
      say: 'Google проверит адрес и попросит пароль.' },
    { id: 'g-password', stage: 'login', host: 'accounts.google.com', el: 'gPassword',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gPassword' } }, { filled: 'gPassword' }] },
      title: 'Введите пароль',
      say: 'Пароль от почты Gmail. Его видите только вы.' },
    { id: 'g-password-next', stage: 'login', host: 'accounts.google.com', el: 'gNext',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gPassword' } }] },
      title: 'Нажмите Далее',
      say: 'После входа Google вернёт вас в Renderforest.' },
    { id: 'g-continue', stage: 'login', host: 'accounts.google.com', el: 'gContinue',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gContinue' } }] },
      title: 'Нажмите Продолжить',
      say: 'Google спрашивает разрешение войти в Renderforest.' },
    { id: 'google-account', stage: 'login', host: 'accounts.google.com',
      skip: { not: { clicked: 'google', within: 900000 } },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в Renderforest.' },
    { id: 'dashboard', stage: 'create', el: 'logo',
      skip: { not: { exists: 'account' } },
      title: 'Нажмите логотип Renderforest',
      say: 'Логотип слева вверху откроет ваш кабинет.' },
    { id: 'templates', stage: 'create', el: ['templatesCard', 'templatesNav'],
      skip: { any: [{ url: '^(/[a-z]{2})?/gen-ai-flow' }, { exists: 'startAi' }, { not: { exists: 'templatesNav' } }] },
      title: 'Откройте Видео Шаблоны',
      say: 'Там мастер ИИ-видео, который работает без кредитов.' },
    { id: 'start-ai', stage: 'create', el: 'startAi',
      skip: { not: { exists: 'startAi' } },
      title: 'Нажмите Начните с ИИ',
      say: 'Первая карточка в разделе Анимация.' },
    { id: 'promo', stage: 'create', el: 'promoClose',
      skip: { not: { exists: 'promoClose' } },
      title: 'Закройте рекламу',
      say: 'Крестик справа вверху. Ссылка для видео не нужна.' },
    { id: 'upsell', stage: 'create', el: 'continueFree',
      skip: { not: { exists: 'continueFree' } },
      title: 'Продолжите бесплатно',
      say: 'Скидку не берите: бесплатного плана хватит.' },
    { id: 'prompt', stage: 'create', el: 'prompt',
      skip: { any: [{ not: { url: '^(/[a-z]{2})?/gen-ai-flow/?$' } }, { filled: 'prompt' }] },
      title: 'Вставьте промт', keys: ['Ctrl', 'V'],
      say: 'Нажмите в поле и вставьте промт из тренажёра.' },
    { id: 'prompt-next', stage: 'create', el: 'next',
      skip: { any: [{ not: { url: '^(/[a-z]{2})?/gen-ai-flow/?$' } }, { not: { filled: 'prompt' } }] },
      title: 'Нажмите Далее',
      say: 'Галочку озвучивания ИИ не снимайте.' },
  ],

  // Выбора режима нет: в инструкции один способ.

  outro: [
    { id: 'realistic', stage: 'create', el: 'realistic',
      skip: { not: { exists: 'realistic' } },
      title: 'Выберите Реалистично',
      say: 'Способ из инструкции: живые кадры, без кредитов.' },
    { id: 'style', stage: 'create', el: 'aiChoice', clickOn: 'styles', done: 'click',
      skip: { not: { exists: 'styles' } },
      title: 'Выберите стиль без короны',
      say: 'Корона значит платно. Выбор ИИ тоже подойдёт.' },
    { id: 'generate', stage: 'create', el: 'generate', done: 'click',
      skip: { not: { exists: 'generate' } },
      title: 'Нажмите Генерировать',
      say: 'Renderforest соберёт видео за несколько минут.' },
    // Без входа Renderforest просит зарегистрироваться на генерации.
    { id: 'signup', stage: 'result', el: 'google',
      skip: { not: { exists: 'google' } },
      title: 'Нажмите Google',
      say: 'Без входа Renderforest не соберёт видео.' },
    { id: 'signup-google', stage: 'result', host: 'accounts.google.com',
      skip: { not: { clicked: 'signup', within: 900000 } },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в Renderforest.' },
    { id: 'upsell-late', stage: 'result', el: 'continueFree',
      skip: { not: { exists: 'continueFree' } },
      title: 'Продолжите бесплатно',
      say: 'Скидку не берите: бесплатного плана хватит.' },
    { id: 'busy', stage: 'result',
      skip: { not: { exists: 'busy' } },
      title: 'Генерация недоступна',
      say: 'Бесплатно сейчас нельзя. Попробуйте через час.' },
    { id: 'wait', stage: 'result',
      skip: { not: { exists: 'loading' } },
      title: 'Подождите несколько минут',
      say: 'Renderforest собирает видео. Вкладку не закрывайте.' },
    { id: 'dl-open', stage: 'result', el: 'download',
      done: { exists: 'dlButton' },
      skip: { not: { exists: 'download' } },
      title: 'Нажмите Загрузить',
      say: 'Бесплатно: 720p и водяной знак Renderforest.' },
    // Выбор в окне ничем не отмечен в разметке: шаг считается сделанным минуту после нажатия.
    { id: 'dl-quality', stage: 'result', el: 'q720',
      skip: { any: [{ not: { exists: 'dlUpgrade' } }, { clicked: 'dl-quality', within: 60000 }] },
      title: 'Выберите 720p',
      say: '1080p платный: с ним кнопка станет Обновить.' },
    { id: 'dl-watermark', stage: 'result', el: 'watermark',
      skip: { any: [{ not: { exists: 'dlUpgrade' } }, { clicked: 'dl-watermark', within: 60000 }] },
      title: 'Выберите Водяной знак',
      say: 'Без водяного знака Renderforest отдаёт только за деньги.' },
    { id: 'dl-save', stage: 'result', el: 'dlSave', download: true,
      skip: { all: [{ not: { exists: 'dlSave' } }, { not: { clicked: 'dl-save', within: 180000 } }] },
      title: 'Нажмите Загрузить',
      say: 'Видео сохранится в папку Загрузки.' },
    { id: 'finish', stage: 'result', last: true,
      skip: { not: { clicked: 'dl-save', within: 3600000 } },
      title: 'Готово',
      say: 'Видео в Загрузках. В тренажёре нажмите Завершить.' },
  ],
});
