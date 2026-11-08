// Карта Gamma. Только данные: ядро её читает, кода здесь нет. Шаги — по двум инструкциям тренажёра
// (data/mayak-service-templates): gamma.pptx — новая презентация по тексту из Qwen (Создать новый,
// Вставить текст), gamma-zamena-fona.pptx — замена фона готовой презентации (Создать новый, Импорт файла).
// Обе идут в классическом генераторе Gamma; кто попал на главную Gamma 5, того карта ведёт туда.
// Gamma переводит интерфейс (кука gammaLocale), поэтому тексты элементов на английском и русском, из
// словаря самой Gamma. Где есть data-testid, ищем по нему: классы у Gamma генерируются.
// Сверено с живой Gamma 05.11.2026: вход, Классический генератор, выбор способа, вставка текста, загрузка
// файла, панель экспорта. Редактор подсказок с кнопкой Сгенерировать и меню ⋯ вживую не открывались
// (генерация тратит кредиты, чужие презентации не открываем): подписи из словаря, проверены на макете.
// title: подпись у курсора, коротко, что сделать; say: пояснение в капсуле, не длиннее 60 знаков.
(window.MAYAK_MAPS ||= []).push({
  service: 'gamma',
  name: 'Gamma',
  hosts: ['gamma.app', 'accounts.google.com'],
  home: 'gamma.app',

  elements: {
    cookies: { css: '#onetrust-banner-sdk #onetrust-button-group' },
    login: { css: 'a[href="/signin"]', text: '^(login|log in|sign in|вход|войти)$' },
    google: { css: 'button', text: '^(continue with google|продолжить с помощью google)$' },
    gAccount: { css: '[data-identifier]' },
    gEmail: { css: 'input[name=identifier], input[type=email]' },
    gPassword: { css: 'input[name=Passwd], input[type=password]' },
    gNext: { css: 'button', text: '^(далее|next)$' },
    gContinue: { css: 'button', text: '^(продолжить|continue)$' },
    // главная после входа (Gamma 5 или классическая); по ней видно, что вход выполнен
    home: { css: '[data-testid="dashboard-v2-root"], [data-testid$="entry-hero"]' },
    classic: { css: '[data-testid="classic-generator-link"]' },
    // Язык интерфейса (Андрей 07.11.2026: "поменять язык интерфейса на русский"): кнопка "?" внизу справа,
    // в меню пункт с текущим языком (English) → окно "Change language": список (кнопка с языком),
    // в нём "Русский", затем Save. Английский узнаётся по надписям страниц.
    help: { css: 'button[aria-label]', text: '^(help|помощь|справка)$' },
    langItem: { css: '[role=menu] button[role=menuitem]', text: '^english$' },
    langMenu: { css: '[role=dialog] button[aria-haspopup=menu]', text: '^english$' },
    ruItem: { css: '[role=menuitemradio]', text: '^русский' },
    langPicked: { css: '[role=dialog] button[aria-haspopup=menu]', text: '^русский' },
    langSave: { css: '[role=dialog] button', text: '^(save|сохранить)$' },
    uiEn: { css: 'h1, h2, h3, button, a', text: '^(create with ai|what are we making today\\?|use classic generator|new from blank|paste in text)$' },
    // Окно-анонс Gamma 5 поверх главной (у Андрея 06.11.2026): пока оно открыто, ссылка не нажимается.
    // "Gamma 5" в тексте бывает и у опроса перед классическим генератором: узнаём по словам анонса.
    promo: { css: '[role=dialog]', text: '(масштабное обновление|biggest update)' },
    survey: { css: '[role=dialog] button', text: '^(skip|пропустить)$' }, // опрос перед классическим генератором
    createNew: { css: '[data-testid="create-file-from-ai-button"]' },
    // Карточки способов на /create. Вкладок у Gamma нет: путь выбирается нажатием на карточку.
    // on требует ядро, такого атрибута нет, поэтому выбранной сама по себе не считается ни одна.
    cards: { css: 'div:has(> div > button[role=group])' },
    pasteCard: { css: 'button[role=group]', text: '^(paste in text|вставить текст)', on: { attr: 'data-mayak-selected', eq: 'true' } },
    genCard: { css: 'button[role=group]', text: '^(generate|сгенерировать|генерировать|создать)', on: { attr: 'data-mayak-selected', eq: 'true' } },
    // Generate: кнопка плана под промтом, потом итоговая генерация (не карточка, не кнопка плана).
    outline: { css: 'button', text: '^(generate outline|создать план|сгенерировать план|создать структуру)' },
    finalGenerate: { css: 'button:not([role=group])', text: '^(generate|сгенерировать|создать)(?! ?(outline|план|структур))' },
    importCard: { css: 'button[role=group]', text: '^(import file or url|импортируйте файл или url)', on: { attr: 'data-mayak-selected', eq: 'true' } },
    pasteArea: { css: '[data-testid="ai-content-editor"]' },
    continue: { css: 'button', text: '^(continue to prompt editor|продолжайте подсказывать редактору)$' },
    uploadCard: { css: 'button[role=group]', text: '^(upload a file|загрузить файл)' },
    importing: { css: '[data-testid="import-loading-card"], [data-testid="import-loading-portal"]' },
    generate: { css: 'button', text: '^(generate|сгенерировать|создать)$' },
    more: { css: '[data-testid="doc-toolbar-menu-button"]' },
    exportItem: { css: '[role=menuitem]', text: '^(export|экспорт)(\\.\\.\\.|…)$' },
    pdf: { css: 'button, [role=menuitem]', text: '^((export (to|as) )?pdf|экспорт в pdf)$' },
    pptx: { css: 'button, [role=menuitem]', text: '^((export (to|as) )?powerpoint|экспорт в powerpoint)$' },
  },

  stages: [
    { id: 'login', title: 'Вход' },
    { id: 'create', title: 'Создание' },
    { id: 'result', title: 'Результат' },
  ],

  intro: [
    { id: 'cookies', stage: 'login', el: 'cookies',
      skip: { not: { exists: 'cookies' } },
      title: 'Закройте окно cookies',
      say: 'Reject All или Accept All: на работу Gamma не влияет.' },
    { id: 'login', stage: 'login', el: 'login',
      skip: { any: [{ exists: 'google' }, { exists: 'home' }, { exists: 'createNew' }, { url: '^/(docs|create|generate|setup)' }] },
      title: 'Нажмите Вход',
      say: 'Вход вверху справа. Аккаунта нет: Начните бесплатно.' },
    { id: 'google', stage: 'login', el: 'google',
      skip: { any: [{ exists: 'home' }, { exists: 'createNew' }, { url: '^/(docs|create|generate|setup)' }] },
      title: 'Нажмите Продолжить с Google',
      say: 'Вход через Google: отдельный пароль для Gamma не нужен.' },
    // Страницы Google: шаг виден только если человек пришёл из Gamma (нажал Продолжить с помощью Google
    // за последние 15 минут). Последний шаг без цели — запасной для всего, что Google покажет ещё.
    { id: 'g-account', stage: 'login', host: 'accounts.google.com', el: 'gAccount',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gAccount' } }] },
      title: 'Нажмите свой аккаунт',
      say: 'Аккаунт Google, через который входите в Gamma.' },
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
      say: 'После входа Google вернёт вас в Gamma.' },
    { id: 'g-continue', stage: 'login', host: 'accounts.google.com', el: 'gContinue',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gContinue' } }] },
      title: 'Нажмите Продолжить',
      say: 'Google спрашивает разрешение войти в Gamma.' },
    { id: 'google-account', stage: 'login', host: 'accounts.google.com',
      skip: { not: { clicked: 'google', within: 900000 } },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в Gamma.' },
    // Первый вход: Gamma знакомится с человеком на /setup. Что там спросят, заранее не известно.
    { id: 'setup', stage: 'login',
      skip: { not: { url: '^/setup' } },
      title: 'Настройте аккаунт',
      say: 'Следуйте шагам Gamma: подойдут любые ответы.' },
    // Анонс Gamma 5 закрывает главную. Своей кнопки закрытия у окна может не быть: Esc или клик рядом.
    { id: 'promo', stage: 'create',
      skip: { any: [{ not: { exists: 'promo' } }, { exists: 'survey' }] },
      title: 'Закройте окно Gamma 5',
      say: 'Нажмите Esc или в любом месте рядом с окном.' },
    { id: 'lang', stage: 'create', el: ['ruItem', 'langMenu', 'langItem', 'help'],
      skip: { any: [{ not: { exists: 'uiEn' } }, { exists: 'langPicked' }] },
      skipLabel: 'Оставить английский',
      title: 'Включите русский язык',
      say: 'Справа внизу знак ?, затем English, в списке Русский.' },
    { id: 'lang-save', stage: 'create', el: 'langSave',
      skip: { not: { exists: 'langPicked' } },
      // после выбора "Русский" окно уже по-русски ("Изменить язык", "Сохранить"); выбор сохраняется сразу
      title: 'Нажмите Сохранить',
      say: 'Кнопка внизу окна: русский язык останется.' },
    // Главная Gamma 5: инструкции тренажёра идут по классическому генератору, ссылка на него вверху.
    { id: 'classic', stage: 'create', el: 'classic',
      skip: { any: [{ not: { exists: 'classic' } }, { exists: 'survey' }] },
      title: 'Нажмите Классический генератор',
      say: 'Шаги тренажёра сделаны в классическом режиме Gamma.' },
    { id: 'survey', stage: 'create', el: 'survey', done: 'click',
      skip: { not: { exists: 'survey' } },
      title: 'Нажмите Пропустить',
      say: 'Gamma спрашивает, почему старый режим. Можно не отвечать.' },
    // Классическая главная
    { id: 'create-new', stage: 'create', el: 'createNew',
      skip: { any: [{ not: { exists: 'createNew' } }, { url: '^/create' }] },
      title: 'Нажмите Создать новый',
      say: 'Новая презентация с помощью ИИ.' },
  ],

  // Выбор способа на /create: кольцо на карточках, метки под двумя нужными. Пока человек на этой
  // странице, шаг виден; ушёл по карточке — путь запомнен по нажатию.
  choose: {
    stage: 'create',
    el: 'cards',
    skip: { not: { url: '^/create/?$' } },
    title: 'Выберите способ',
    say: 'Выберите по заданию: что у вас уже есть.',
  },

  paths: {
    // Три способа (Андрей 07.11.2026): с нуля по промту МАЯК-ОКО, по готовому тексту, замена фона.
    // when — путь по адресу страницы способа, если человек пришёл туда не через карточку.
    generate: {
      tab: 'genCard',
      when: { url: '^/create/generate' },
      mark: 'Есть только промт МАЯК-ОКО',
      note: 'с нуля',
      // Сверено вживую до кнопки плана (07.11.2026). Страницу плана и итоговую кнопку вживую не видели:
      // кнопка плана в окне агента не срабатывала от программного ввода; шаги по устройству Gamma.
      steps: [
        { id: 'g-prompt', stage: 'create', el: 'pasteArea',
          skip: { any: [{ filled: 'pasteArea' }, { not: { url: '^/create/generate' } }] },
          title: 'Вставьте промт', keys: ['Ctrl', 'V'],
          say: 'Промт МАЯК-ОКО: в тренажёре Скопировать, затем сюда.' },
        { id: 'g-outline', stage: 'create', el: 'outline', done: 'click',
          skip: { not: { url: '^/create/generate' } },
          title: 'Постройте план слайдов',
          say: 'Кнопка под промтом. План бесплатный, его можно поправить.' },
        { id: 'g-generate', stage: 'create', el: 'finalGenerate', wait: 120000, done: 'click',
          title: 'Нажмите Сгенерировать',
          say: 'Проверьте план. Генерация тратит бесплатные кредиты.' },
      ],
    },
    text: {
      tab: 'pasteCard',
      when: { url: '^/create/paste' },
      mark: 'Есть готовый текст по слайдам',
      note: 'по тексту',
      steps: [
        { id: 't-paste', stage: 'create', el: 'pasteArea',
          skip: { any: [{ filled: 'pasteArea' }, { not: { url: '^/create/paste' } }] },
          title: 'Вставьте текст', keys: ['Ctrl', 'V'],
          say: 'Текст, который Qwen написал по промту из тренажёра.' },
        { id: 't-continue', stage: 'create', el: 'continue',
          done: { not: { url: '^/create/paste' } },
          title: 'Нажмите кнопку под текстом',
          say: 'Продолжайте подсказывать редактору: Gamma разобьёт текст.' },
      ],
    },
    file: {
      tab: 'importCard',
      when: { url: '^/create/import' },
      mark: 'Нужна замена фона',
      note: 'замена фона',
      steps: [
        { id: 'f-wait', stage: 'create',
          skip: { not: { exists: 'importing' } },
          title: 'Дождитесь загрузки',
          say: 'Gamma читает файл, это до минуты.' },
        { id: 'f-upload', stage: 'create', el: 'uploadCard',
          done: { not: { url: '^/create/import' } },
          title: 'Загрузите презентацию',
          say: 'Загрузить файл, затем файл задания из папки Загрузки.' },
      ],
    },
  },

  outro: [
    // Редактор подсказок (/generate/...): тема слева, кнопка Сгенерировать внизу.
    { id: 'generate', stage: 'create', el: 'generate', done: 'click',
      skip: { not: { url: '^/generate/' } },
      title: 'Нажмите Сгенерировать',
      say: 'Сначала выберите тему слева. Тратит бесплатные кредиты.' },
    { id: 'export-open', stage: 'result', el: ['exportItem', 'more'], wait: 180000,
      done: { exists: ['pdf', 'pptx'] },
      skip: { any: [{ exists: 'home' }, { url: '^/(create|generate)' }] },
      title: 'Откройте Экспорт',
      say: 'Когда слайды готовы: три точки вверху, затем Экспорт.' },
    { id: 'export-file', stage: 'result', el: ['pdf', 'pptx'], download: true,
      skip: { any: [{ exists: 'home' }, { url: '^/(create|generate)' }] },
      title: 'Скачайте PDF или PPTX',
      say: 'PDF или PowerPoint. На бесплатном плане есть значок Gamma.' },
    { id: 'finish', stage: 'result', last: true,
      title: 'Готово',
      say: 'Файл в Загрузках. В тренажёре: Завершить и загрузить файл.' },
  ],
});
