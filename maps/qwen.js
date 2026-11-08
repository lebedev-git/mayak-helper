// Карта Qwen (chat.qwen.ai). Только данные: ядро её читает, кода здесь нет. Шаги — по инструкциям
// тренажёра для Qwen (фото, видео, текст: data/mayak-service-templates/qwen-*.pptx): вход через Google,
// вставить промт, выбрать формат в меню "+", запустить, забрать результат, сдать в тренажёре.
// Сайт (веб-разработка) по просьбе Андрея 06.11.2026, инструкции тренажёра нет: сверено с живым Qwen
// до кнопки Развернуть; окно со ссылкой не открывали (Развернуть публикует сайт), шаг ссылки в капсуле.
// Кнопки ищутся по видимому тексту и aria-label (русский и английский интерфейс). Где подписи нет, взяты
// смысловые классы из кода Qwen (qwen-chat-message-assistant, response-message-footer), не сгенерированные.
// Сверено с живым Qwen 05.11.2026 с входом и без, до отправки промта; результат (ответ, картинка, видео)
// собран по коду страницы: генерация тратит лимиты, вживую не запускалась.
// title: подпись у курсора, коротко, что сделать; say: пояснение в капсуле, не длиннее 60 знаков.
(() => {
// Шаги, общие для всех форматов. Промт отправлен, когда в чате появилось сообщение человека: так шаг
// закрывается и после Enter, который ядро как нажатие не видит. Смена режима текст в поле не стирает.
const prompt = (id) => ({ id, stage: 'create', el: 'prompt',
  skip: { filled: 'prompt' }, done: { exists: 'sent' },
  redo: { all: [{ exists: 'prompt' }, { not: { filled: 'prompt' } }, { not: { exists: 'sent' } }] },
  title: 'Вставьте промт', keys: ['Ctrl', 'V'],
  say: 'Промт из тренажёра: кнопка Скопировать, затем сюда.' });
// Режим в меню "+": кольцо на "+", в открытом меню на нужном пункте; готово, когда режим включён.
const mode = (id, tab, item, name) => ({ id, stage: 'create', el: [item, 'plus'],
  done: { on: tab },
  redo: { all: [{ exists: 'plus' }, { not: { on: tab } }, { not: { exists: 'sent' } }] },
  title: `Включите ${name}`,
  say: `Нажмите + и выберите ${name}.` });
// Модель картинки или видео: шаг только если выбрана не та (Андрей, 06.11.2026); по умолчанию Qwen
// ставит нужную, и шаг пропускается сам.
const model = (id, btn, ok, item, title, say) => ({ id, stage: 'create', el: [item, btn],
  skip: { any: [{ exists: ok }, { exists: 'sent' }, { not: { exists: btn } }] },
  redo: { all: [{ exists: btn }, { not: { exists: ok } }, { not: { exists: 'sent' } }] },
  title, say });
// Настройка кадра по желанию (Андрей 06.11.2026: "не увидел, что можно выбрать разрешение"):
// кольцо на кнопке настройки, в открытом списке на нём; нажатие внутри списка или Пропустить.
// stay: окно настройки не закрывается само (параметры видео) и закрывает поле промта: шаг готов,
// когда в окне что-то выбрали и окно закрыли.
const setup = (id, list, btn, title, say, stay) => ({ id, stage: 'create', el: [list, btn], clickOn: list,
  done: stay ? { all: [{ clicked: id, within: 600000 }, { not: { exists: list } }] } : 'click',
  skip: { any: [{ exists: 'sent' }, { not: { exists: btn } }] },
  skipLabel: 'Оставить как есть',
  title, say });
// Доп. материал из задания (файл, картинка) по желанию: + и Загрузить вложение, или Пропустить.
// Материал нужен не всегда (Андрей 07.11.2026): отказ — кнопка "Материала нет" в капсуле.
const attach = (id) => ({ id, stage: 'create', el: ['uploadItem', 'plus'], clickOn: 'uploadItem', done: 'click',
  skip: { exists: 'sent' },
  skipLabel: 'Материала нет',
  title: 'Добавьте материал, если нужен',
  say: 'Есть файл в задании? Нажмите + и Загрузить вложение.' });
// Выбор из двух ответов, если Qwen его просит: шаг виден, пока список на экране.
const pick = (id) => ({ id, stage: 'result', el: 'abList',
  skip: { not: { exists: 'abList' } },
  title: 'Выберите лучший ответ',
  say: 'Qwen дал два ответа: Предпочитаю под тем, что лучше.' });
const send = (id, title, say) => ({ id, stage: 'create', el: 'send',
  // нажатие засчитывается 2 мин, пока сообщение не появилось: дольше — это уже прошлая задача
  done: { any: [{ clicked: id, within: 120000 }, { exists: 'sent' }] },
  title, keys: ['Enter'], say });

(window.MAYAK_MAPS ||= []).push({
  service: 'qwen',
  name: 'Qwen',
  // qwen.ai/home: туда ведёт ссылка части заданий, оттуда кнопка Попробовать Qwen открывает чат.
  hosts: ['chat.qwen.ai', 'qwen.ai', 'accounts.google.com'],
  home: 'chat.qwen.ai',
  // Заставка загрузки: пока она есть, кнопка "Войти" бывает и у вошедших (около 4 с, 07.11.2026).
  loading: 'splash',
  // Новый чат: сообщений нет, поле ввода на месте. Помощник на результате прошлой задачи — сброс.
  newTask: { all: [{ exists: 'prompt' }, { not: { exists: 'sent' } }] },
  sentMark: 'sent',

  elements: {
    studio: { css: 'button, a', text: '^(попробовать qwen|try qwen)' },
    login: { css: 'button', text: '^(войти|sign in|log in)$' },
    google: { css: 'button', text: '(продолжить с|continue with) google' },
    gAccount: { css: '[data-identifier]' },
    gEmail: { css: 'input[name=identifier], input[type=email]' },
    gPassword: { css: 'input[name=Passwd], input[type=password]' },
    gNext: { css: 'button', text: '^(далее|next)$' },
    gContinue: { css: 'button', text: '^(продолжить|continue)$' },
    prompt: { css: 'textarea' },
    // Формат выбирается в меню "+": у кнопки aria-label "Выбрать режим", меню вынесено в конец body.
    // $ в конце обязателен: у выбора модели aria-label "Select Model".
    plus: { css: '[role=button][aria-label]', text: '^(выбрать режим|select mode|загрузить вложение|upload attachment)$' },
    menu: { css: '[role=menu]', text: '(создать изображение|create image)' },
    send: { css: 'button[aria-label]', text: '^(отправить|send)$' },
    // Вкладки форматов. Картинка и видео — плашка выбранного режима в поле, у неё aria-disabled="false".
    // Пункты меню не вкладки: метка ядра встаёт под элементом и в вертикальном меню легла бы на
    // соседний пункт. Текст — кнопка отправки, пока в поле обычная подсказка (в режимах картинки и
    // видео она другая) и меню закрыто; on сверяется с русской подписью, у английской путь текста
    // выбирается нажатием на отправку.
    imageTab: { css: '[aria-disabled]:not([role=menuitem])', text: '^(создать изображение|create image)$', on: { attr: 'aria-disabled', eq: 'false' } },
    videoTab: { css: '[aria-disabled]:not([role=menuitem])', text: '^(создать видео|create video)$', on: { attr: 'aria-disabled', eq: 'false' } },
    webTab: { css: '[aria-disabled]:not([role=menuitem])', text: '^(веб-разработка|web dev(elopment)?)$', on: { attr: 'aria-disabled', eq: 'false' } },
    // Пункты меню "+" и список моделей (кнопка с названием модели, aria-label "Select Model").
    imageItem: { css: '[role=menu] [role=menuitem]', text: '^(создать изображение|create image)' },
    videoItem: { css: '[role=menu] [role=menuitem]', text: '^(создать видео|create video)' },
    webItem: { css: '[role=menu] [role=menuitem]', text: '^(веб-разработка|web dev)' },
    uploadItem: { css: '[role=menu] [role=menuitem]', text: '^(загрузить вложение|upload attachment)' },
    modelBtn: { css: '[aria-label="Select Model"]' },
    // крестик у включённого режима (картинка, видео, сайт) в строке ввода
    modeClose: { css: '.mode-select-current-mode-close' },
    modelMax: { css: '[aria-label="Select Model"]', text: 'qwen[\\d.]+-max' },
    maxItem: { css: '[role=listbox] [role=option]', text: '^qwen[\\d.]+-max' },
    // Модель картинок и видео — свой список рядом с режимом в строке ввода (06.11.2026): картинки
    // Qwen-Image 3.0 (Pro только по подписке, VIP), видео самая новая HappyHorse (верх списка, не 1.0).
    imgModelBtn: { css: '.mode-select .qwen-chat-v2-dropdown-menu-select', text: '^qwen-image' },
    imgModelOk: { css: '.mode-select .qwen-chat-v2-dropdown-menu-select', text: '^qwen-image [\\d.]+$' },
    imgModelItem: { css: '.qwen-chat-v2-dropdown-menu-item:has(.image-model-selector-item-title)', text: '^qwen-image [\\d.]+(?![\\d.]| ?pro)' },
    vidModelBtn: { css: '.mode-select .qwen-chat-v2-dropdown-menu-select', text: '^happyhorse' },
    vidModelOk: { css: '.mode-select .qwen-chat-v2-dropdown-menu-select', text: '^happyhorse (?!1\\.0$)[\\d.]+$' },
    vidModelItem: { css: '.qwen-chat-v2-dropdown-menu-item:has(.video-model-selector-item-title)', text: '^happyhorse (?!1\\.0(?![\\d]))[\\d.]+' },
    // Формат кадра картинки — второй список в строке ввода (16:9, 1:1, 9:16...), его выпадающее окно
    // узнаётся по пунктам из одних чисел. Видео: кнопка "Параметры видео", окно с разрешением
    // (1080P только VIP), форматом кадра и длиной (длиннее — больше кредитов).
    ratioBtn: { css: '.mode-select .qwen-chat-v2-dropdown-menu-select', text: '^\\d+:\\d+$' },
    ratioList: { css: '.qwen-chat-v2-dropdown-menu-popup', text: '^[\\d: ]+$' },
    vidParamsBtn: { css: 'button[aria-label]', text: '^(параметры видео|video (params|parameters|settings))' }, // в подписи ещё "720P · 5s"
    vidParamsPanel: { css: '.video-params-panel' },
    splash: { css: '.splash-skeleton-group' },
    // Иногда Qwen показывает два ответа рядом и просит выбрать ("Предпочитаю этот ответ"); пока не
    // выбран, под ответом нет кнопки Копировать (07.11.2026, на модели Max).
    abList: { css: '.smrm-list' },
    sent: { css: '.qwen-chat-message-user' },
    // Кнопки под последним ответом Qwen, не под сообщением человека и не в блоке кода.
    copy: { css: '.qwen-chat-message-assistant:not(:has(~ .qwen-chat-message-assistant)) .response-message-footer button', text: '^(копировать|copy)$' },
    download: { css: '.qwen-chat-message-assistant:not(:has(~ .qwen-chat-message-assistant)) button[aria-label]', text: '^(скачать|download)$' },
    preview: { css: '[role=dialog] button, [role=dialog] [role=button]', text: '^(скачать|download)$' },
    // Сайт: панель справа открывает кнопка превью под ответом, над панелью Развернуть.
    webOpen: { css: '.qwen-chat-message-assistant:not(:has(~ .qwen-chat-message-assistant)) button', text: '^(превью|preview)$' },
    deploy: { css: 'button', text: '^(развернуть|deploy)$' },
  },

  stages: [
    { id: 'login', title: 'Вход' },
    { id: 'create', title: 'Запрос' },
    { id: 'result', title: 'Результат' },
  ],

  intro: [
    // На qwen.ai/home шаг виден, пока есть кнопка; в чате её нет, и шаг пропускается.
    { id: 'studio', stage: 'login', host: 'qwen.ai', el: 'studio',
      skip: { not: { exists: 'studio' } },
      title: 'Нажмите Попробовать Qwen',
      say: 'Кнопка справа вверху: откроется чат Qwen.' },
    { id: 'login', stage: 'login', el: 'login',
      skip: { not: { exists: 'login' } },
      title: 'Нажмите Войти',
      say: 'Кнопка справа вверху. Без входа видео не сделать.' },
    { id: 'google', stage: 'login', el: 'google',
      skip: { not: { exists: 'google' } },
      title: 'Нажмите Продолжить с Google',
      say: 'Вход через Google: отдельный пароль для Qwen не нужен.' },
    // Страницы Google: шаг виден только если человек пришёл из Qwen (нажал Продолжить с Google за
    // последние 15 минут). Последний шаг без цели запасной для всего, что Google покажет ещё.
    { id: 'g-account', stage: 'login', host: 'accounts.google.com', el: 'gAccount',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gAccount' } }] },
      title: 'Нажмите свой аккаунт',
      say: 'Аккаунт Google, через который входите в Qwen.' },
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
      say: 'После входа Google вернёт вас в Qwen.' },
    { id: 'g-continue', stage: 'login', host: 'accounts.google.com', el: 'gContinue',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gContinue' } }] },
      title: 'Нажмите Продолжить',
      say: 'Google спрашивает разрешение войти в Qwen.' },
    { id: 'google-account', stage: 'login', host: 'accounts.google.com',
      skip: { not: { clicked: 'google', within: 900000 } },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в Qwen.' },
    // Модель: самая сильная Max (Андрей, 06.11.2026). Список открывается кнопкой с названием модели,
    // выбранная Max остаётся и в режимах картинки и видео (проверено вживую).
    { id: 'model', stage: 'create', el: ['maxItem', 'modelBtn'],
      skip: { any: [{ exists: 'modelMax' }, { exists: 'sent' }] },
      redo: { all: [{ exists: 'modelBtn' }, { not: { exists: 'modelMax' } }, { not: { exists: 'sent' } }] },
      title: 'Выберите модель Max',
      say: 'Сверху название модели: нажмите и выберите вариант Max.' },
  ],

  // Формат первым (Андрей, 06.11.2026): кнопки в капсуле, как в задании тренажёра. Если режим уже
  // выбран в "+" или промт отправлен, шаг не нужен: путь берётся по выбранному режиму.
  choose: {
    stage: 'create',
    buttons: true,
    // путь выбран режимом Qwen (картинка, видео, сайт) — ядро шаг пропускает само
    skip: { exists: 'sent' },
    again: 'Другой формат',
    title: 'Что делаем?',
    say: 'Выберите формат, как в задании тренажёра.',
  },

  // Путь: label — кнопка в капсуле, tab — режим Qwen, по которому путь узнаётся сам (у текста режима
  // нет), note — тихая подпись под режимом. Общие шаги собраны функциями выше карты.
  paths: {
    text: {
      label: 'Текст',
      steps: [
        // текст выбран кнопкой, а в Qwen ещё включён режим картинки, видео или сайта
        { id: 't-nomode', stage: 'create', el: 'modeClose',
          skip: { any: [{ not: { exists: 'modeClose' } }, { exists: 'sent' }] },
          title: 'Уберите режим',
          say: 'Для текста режим не нужен: нажмите крестик у режима.' },
        prompt('t-prompt'), attach('t-attach'), send('t-send', 'Отправьте промт', 'Стрелка справа или Enter. Потом дождитесь ответа.'),
        pick('t-pick'),
        { id: 't-copy', stage: 'result', el: 'copy', wait: 180000, done: 'click',
          title: 'Скопируйте ответ',
          say: 'Дождитесь конца ответа и нажмите Копировать под ним.' },
        { id: 't-finish', stage: 'result', last: true,
          title: 'Готово',
          say: 'Вставьте ответ в файл, в тренажёре нажмите Завершить.' },
      ],
    },
    image: {
      label: 'Картинка',
      tab: 'imageTab',
      note: 'картинка',
      steps: [
        mode('i-mode', 'imageTab', 'imageItem', 'Создать изображение'),
        model('i-model', 'imgModelBtn', 'imgModelOk', 'imgModelItem', 'Выберите Qwen-Image', 'Модель картинок без Pro: Pro работает только по подписке.'),
        setup('i-ratio', 'ratioList', 'ratioBtn', 'Выберите формат кадра', '16:9 широкий, 1:1 квадрат, 9:16 для телефона.'),
        prompt('i-prompt'), attach('i-attach'), send('i-send', 'Запустите генерацию', 'Стрелка справа или Enter: Qwen нарисует картинку.'),
        { id: 'i-download', stage: 'result', el: ['preview', 'download'], wait: 240000, download: true,
          title: 'Скачайте картинку',
          say: 'Оцените результат и нажмите Скачать под картинкой.' },
        { id: 'i-finish', stage: 'result', last: true,
          title: 'Готово',
          say: 'Картинка в "Загрузках". В тренажёре нажмите Завершить.' },
      ],
    },
    video: {
      label: 'Видео',
      tab: 'videoTab',
      note: 'видео',
      steps: [
        mode('v-mode', 'videoTab', 'videoItem', 'Создать видео'),
        model('v-model', 'vidModelBtn', 'vidModelOk', 'vidModelItem', 'Выберите новую HappyHorse', 'Модель видео: самая новая HappyHorse, она вверху списка.'),
        setup('v-params', 'vidParamsPanel', 'vidParamsBtn', 'Настройте видео', '1080P только VIP, длиннее дороже. Потом клик мимо окна.', true),
        prompt('v-prompt'), attach('v-attach'), send('v-send', 'Запустите видео', 'Стрелка справа или Enter. Видео делается несколько минут.'),
        { id: 'v-download', stage: 'result', el: ['preview', 'download'], wait: 900000, download: true,
          title: 'Скачайте видео',
          say: 'Оцените результат и нажмите Скачать под роликом.' },
        { id: 'v-finish', stage: 'result', last: true,
          title: 'Готово',
          say: 'Видео в "Загрузках". В тренажёре нажмите Завершить.' },
      ],
    },
    site: {
      label: 'Сайт',
      tab: 'webTab',
      note: 'сайт',
      steps: [
        mode('s-mode', 'webTab', 'webItem', 'веб-разработка'),
        prompt('s-prompt'), attach('s-attach'), send('s-send', 'Отправьте промт', 'Стрелка справа или Enter. Qwen соберёт сайт за пару минут.'),
        pick('s-pick'),
        // Панель сайта открывается сама; если её закрыли, кнопка превью под ответом.
        { id: 's-open', stage: 'result', el: 'webOpen',
          skip: { any: [{ exists: 'deploy' }, { not: { exists: 'webOpen' } }] },
          title: 'Откройте сайт',
          say: 'Нажмите превью под ответом: сайт откроется справа.' },
        { id: 's-deploy', stage: 'result', el: 'deploy', wait: 600000, done: 'click',
          title: 'Нажмите Развернуть',
          say: 'Проверьте сайт справа. Развернуть даст ссылку на него.' },
        { id: 's-finish', stage: 'result', last: true,
          title: 'Скопируйте ссылку',
          say: 'Скопируйте ссылку из окна Развернуть и сдайте в тренажёр.' },
      ],
    },
  },

  // Шаги путей заканчиваются своим "Готово"; этот нужен, только если режим не распознан.
  outro: [
    { id: 'finish', stage: 'result', last: true,
      title: 'Готово',
      say: 'Сохраните результат, в тренажёре нажмите Завершить.' },
  ],
});
})();
