// Карта PixVerse. Только данные: ядро её читает, кода здесь нет. Шаги — по инструкции тренажёра
// (data/mayak-service-templates/pixverse.pptx): вход через Google, раздел создания или шаблон, фото,
// промт движения, Создать, Download, Завершить в тренажёре. Элементы ищутся по видимому тексту и id
// режимов PixVerse (image_text, effect): Tailwind-классы меняются, id нет.
// Сверено с живым PixVerse 05.11.2026 без входа: сайт, окно рекламы, вход, вкладки режимов, слоты фото
// и шаблона. После входа не проверены: загруженное фото, страница Создание, меню скачивания.
// title: подпись у курсора, коротко, что сделать; say: пояснение в капсуле, не длиннее 60 знаков.
(window.MAYAK_MAPS ||= []).push({
  service: 'pixverse',
  name: 'PixVerse',
  hosts: ['pixverse.ai', 'app.pixverse.ai', 'accounts.google.com'],
  home: 'pixverse.ai', // и сайт, и приложение app.pixverse.ai
  dock: 248, // капсула помощника над панелью создания PixVerse (она прибита к низу окна)

  elements: {
    tryApp: { css: 'a[href^="https://app.pixverse.ai"]', text: '^попробовать pixverse' }, // сайт pixverse.ai
    promoClose: { css: '[role=dialog] button', text: '^$' }, // крестик окна рекламы (Kling 4.0 и т. п.)
    login: { css: 'button', text: '^вход$' }, // в шапке; на странице /login так же подписана кнопка формы
    // Google Identity Services рисует кнопку в своём iframe: нажатие в нём до страницы не доходит
    gsi: { css: 'iframe[src*="accounts.google.com/gsi/button"]' },
    gAccount: { css: '[data-identifier]' },
    gEmail: { css: 'input[name=identifier], input[type=email]' },
    gPassword: { css: 'input[name=Passwd], input[type=password]' },
    gNext: { css: 'button', text: '^(далее|next)$' },
    gContinue: { css: 'button', text: '^(продолжить|continue)$' },
    // Вкладки режимов: у выбранной подпись жирная и белая (класс внутреннего блока)
    modes: { css: 'div:has(> #image_text)' },
    photoTab: { css: '#image_text .text-nowrap', on: { attr: 'class', eq: 'relative text-xs text-nowrap select-none text-center text-text-white-primary font-semibold' } },
    templateTab: { css: '#effect .text-nowrap', on: { attr: 'class', eq: 'relative text-xs text-nowrap select-none text-center text-text-white-primary font-semibold' } },
    photoSlot: { css: '#image_text-customer_img_path' },
    photoDone: { css: '#image_text-customer_img_path img' },
    templateSlot: { css: '#effect-template_id' },
    templateDone: { css: '#effect-template_id img' },
    templateUpload: { css: '#effect-upload' },
    templateUploadDone: { css: '#effect-upload img, #effect-customer_img_paths img' },
    prompt: { css: 'form textarea' },
    create: { css: 'form button', text: '^создать' }, // "Создать 38": цена в кредитах на кнопке
    creationNav: { css: 'a[href^="/creation"]' }, // 07.11.2026 PixVerse сменил /creation/video на /creation/assets
    dlWatermark: { css: '[role=menuitem], button, li, div', text: '^с водяным знаком$' },
  },

  stages: [
    { id: 'login', title: 'Вход' },
    { id: 'create', title: 'Создание' },
    { id: 'result', title: 'Результат' },
  ],

  intro: [
    { id: 'try-app', stage: 'login', el: 'tryApp',
      skip: { not: { exists: 'tryApp' } },
      title: 'Нажмите Попробовать PixVerse',
      say: 'Откроется приложение PixVerse, где создаются видео.' },
    { id: 'promo', stage: 'login', host: 'app.pixverse.ai', el: 'promoClose',
      skip: { not: { exists: 'promoClose' } },
      title: 'Закройте рекламу',
      say: 'Окно с новостями PixVerse: для задания оно не нужно.' },
    { id: 'login', stage: 'login', host: 'app.pixverse.ai', el: 'login',
      skip: { any: [{ not: { exists: 'login' } }, { url: '^/login' }] },
      title: 'Нажмите Вход',
      say: 'Без входа PixVerse не сохранит и не отдаст видео.' },
    { id: 'gsi', stage: 'login', host: 'app.pixverse.ai', el: 'gsi',
      skip: { not: { exists: 'gsi' } },
      title: 'Войдите через Google',
      say: 'Белая кнопка Google: отдельный пароль для PixVerse не нужен.' },
    // Страницы Google: нажатие на кнопку Google в iframe помощник не видит, поэтому шаги Google
    // ждут нажатия Вход в шапке за последние 15 минут.
    { id: 'g-account', stage: 'login', host: 'accounts.google.com', el: 'gAccount',
      skip: { any: [{ not: { clicked: 'login', within: 900000 } }, { not: { exists: 'gAccount' } }] },
      title: 'Нажмите свой аккаунт',
      say: 'Аккаунт Google, через который входите в PixVerse.' },
    { id: 'g-email', stage: 'login', host: 'accounts.google.com', el: 'gEmail',
      skip: { any: [{ not: { clicked: 'login', within: 900000 } }, { not: { exists: 'gEmail' } }, { filled: 'gEmail' }] },
      title: 'Введите почту Gmail',
      say: 'Адрес почты, например ivanov@gmail.com.' },
    { id: 'g-email-next', stage: 'login', host: 'accounts.google.com', el: 'gNext',
      skip: { any: [{ not: { clicked: 'login', within: 900000 } }, { not: { exists: 'gEmail' } }] },
      title: 'Нажмите Далее',
      say: 'Google проверит адрес и попросит пароль.' },
    { id: 'g-password', stage: 'login', host: 'accounts.google.com', el: 'gPassword',
      skip: { any: [{ not: { clicked: 'login', within: 900000 } }, { not: { exists: 'gPassword' } }, { filled: 'gPassword' }] },
      title: 'Введите пароль',
      say: 'Пароль от почты Gmail. Его видите только вы.' },
    { id: 'g-password-next', stage: 'login', host: 'accounts.google.com', el: 'gNext',
      skip: { any: [{ not: { clicked: 'login', within: 900000 } }, { not: { exists: 'gPassword' } }] },
      title: 'Нажмите Далее',
      say: 'После входа Google вернёт вас в PixVerse.' },
    { id: 'g-continue', stage: 'login', host: 'accounts.google.com', el: 'gContinue',
      skip: { any: [{ not: { clicked: 'login', within: 900000 } }, { not: { exists: 'gContinue' } }] },
      title: 'Нажмите Продолжить',
      say: 'Google спрашивает разрешение войти в PixVerse.' },
    { id: 'google-account', stage: 'login', host: 'accounts.google.com',
      skip: { not: { clicked: 'login', within: 900000 } },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в PixVerse.' },
  ],

  // Выбор из инструкции: раздел создания (своё фото и промт) или готовый шаблон. Режим PixVerse
  // помнит сам, поэтому путь следует за выбранной вкладкой; фото уже загружено — выбор сделан.
  choose: {
    stage: 'create',
    host: 'app.pixverse.ai',
    el: 'modes',
    done: 'click',
    skip: { any: [{ not: { exists: 'modes' } }, { exists: 'photoDone' }, { exists: 'templateDone' }] },
    title: 'Выберите режим',
    say: 'Своё фото и промт или готовый эффект: метки под вкладками.',
  },

  paths: {
    photo: {
      tab: 'photoTab',
      mark: 'Своё фото и промт',
      note: 'фото и промт',
      steps: [
        { id: 'p-upload', stage: 'create', host: 'app.pixverse.ai', el: 'photoSlot',
          skip: { exists: 'photoDone' },
          title: 'Загрузите фото',
          say: 'Квадрат слева: выберите снимок с компьютера.' },
        { id: 'p-prompt', stage: 'create', host: 'app.pixverse.ai', el: 'prompt',
          skip: { filled: 'prompt' },
          title: 'Вставьте промт', keys: ['Ctrl', 'V'],
          say: 'Промт из тренажёра: что и как должно двигаться.' },
        { id: 'p-create', stage: 'create', host: 'app.pixverse.ai', el: 'create', done: 'click',
          title: 'Нажмите Создать',
          say: 'Цена в кредитах на кнопке. Видео будет через 1-2 минуты.' },
      ],
    },
    template: {
      tab: 'templateTab',
      mark: 'Готовый эффект',
      note: 'шаблон',
      steps: [
        { id: 't-template', stage: 'create', host: 'app.pixverse.ai', el: 'templateSlot',
          skip: { exists: 'templateDone' },
          title: 'Выберите шаблон',
          say: 'Нажмите на эффект в списке, текст PixVerse впишет сам.' },
        { id: 't-upload', stage: 'create', host: 'app.pixverse.ai', el: 'templateUpload',
          skip: { exists: 'templateUploadDone' },
          title: 'Загрузите фото',
          say: 'Квадрат рядом с шаблоном: снимок с компьютера.' },
        { id: 't-create', stage: 'create', host: 'app.pixverse.ai', el: 'create', done: 'click',
          title: 'Нажмите Создать',
          say: 'Цена в кредитах на кнопке. Видео будет через 1-2 минуты.' },
      ],
    },
  },

  outro: [
    { id: 'open-creation', stage: 'result', host: 'app.pixverse.ai', el: 'creationNav',
      done: { url: '^/creation' },
      title: 'Откройте Создание',
      say: 'Раздел слева: новое видео там первое, пока оно готовится.' },
    { id: 'dl-open', stage: 'result', host: 'app.pixverse.ai', wait: 180000,
      done: { exists: 'dlWatermark' },
      title: 'Нажмите стрелку скачивания',
      say: 'Когда видео готово, стрелка вниз на его карточке.' },
    { id: 'dl-file', stage: 'result', host: 'app.pixverse.ai', el: 'dlWatermark', download: true,
      title: 'Нажмите С водяным знаком',
      say: 'Без водяного знака скачивают только по подписке.' },
    { id: 'finish', stage: 'result', last: true,
      title: 'Готово',
      say: 'Видео в "Загрузках". В тренажёре нажмите Завершить.' },
  ],
});
