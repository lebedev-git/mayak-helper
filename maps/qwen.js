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
(window.MAYAK_MAPS ||= []).push({
  service: 'qwen',
  name: 'Qwen',
  // qwen.ai/home: туда ведёт ссылка части заданий, оттуда кнопка Попробовать Qwen открывает чат.
  hosts: ['chat.qwen.ai', 'qwen.ai', 'accounts.google.com'],
  home: 'chat.qwen.ai',

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
    textTab: {
      css: 'body:has(textarea:is([placeholder*="помочь"], [placeholder*="help"])):not(:has([role=menu])) button[aria-label]',
      text: '^(отправить|send)$',
      on: { attr: 'aria-label', eq: 'Отправить' },
    },
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
    // Промт отправлен, когда в чате появилось сообщение человека: так шаг закрывается и после Enter,
    // который ядро как нажатие не видит. Смена режима текст в поле не стирает.
    { id: 'prompt', stage: 'create', el: 'prompt',
      skip: { filled: 'prompt' }, done: { exists: 'sent' },
      title: 'Вставьте промт', keys: ['Ctrl', 'V'],
      say: 'Промт из тренажёра: кнопка Скопировать, затем сюда.' },
  ],

  // Выбор формата, промт уже в поле. Картинка и видео: меню "+" (кольцо на "+", в открытом меню на
  // меню). Текст: метка под кнопкой отправки, отправить сразу. Закрывается нажатием в меню или на
  // отправку, выбранным режимом картинки или видео, отправленным промтом.
  choose: {
    stage: 'create',
    el: ['menu', 'plus'],
    clickOn: ['menu', 'textTab'],
    done: 'click',
    skip: { any: [{ on: 'imageTab' }, { on: 'videoTab' }, { on: 'webTab' }, { exists: 'sent' }] },
    title: 'Выберите формат',
    say: 'Картинка, видео, сайт: нажмите +. Текст: сразу отправьте.',
  },

  // Путь — режим, который сейчас выбран в Qwen; mark — метка на шаге выбора формата, note — тихая
  // подпись на остальных шагах. Текст, фото, видео — инструкции тренажёра; сайт — веб-разработка Qwen.
  paths: {
    text: {
      tab: 'textTab',
      mark: 'Задание на текст: отправьте',
      note: 'текст',
      steps: [
        { id: 't-send', stage: 'create', el: 'send',
          done: { any: [{ clicked: 't-send', within: 3600000 }, { exists: 'sent' }] },
          title: 'Отправьте промт', keys: ['Enter'],
          say: 'Стрелка справа или Enter. Потом дождитесь ответа.' },
        { id: 't-copy', stage: 'result', el: 'copy', wait: 180000, done: 'click',
          title: 'Скопируйте ответ',
          say: 'Дождитесь конца ответа и нажмите Копировать под ним.' },
        { id: 't-finish', stage: 'result', last: true,
          title: 'Готово',
          say: 'Вставьте ответ в файл, в тренажёре нажмите Завершить.' },
      ],
    },
    image: {
      tab: 'imageTab',
      mark: 'Задание на картинку',
      note: 'картинка',
      steps: [
        { id: 'i-send', stage: 'create', el: 'send',
          done: { any: [{ clicked: 'i-send', within: 3600000 }, { exists: 'sent' }] },
          title: 'Запустите генерацию', keys: ['Enter'],
          say: 'Стрелка справа или Enter: Qwen нарисует картинку.' },
        { id: 'i-download', stage: 'result', el: ['preview', 'download'], wait: 240000, download: true,
          title: 'Скачайте картинку',
          say: 'Оцените результат и нажмите Скачать под картинкой.' },
        { id: 'i-finish', stage: 'result', last: true,
          title: 'Готово',
          say: 'Картинка в "Загрузках". В тренажёре нажмите Завершить.' },
      ],
    },
    video: {
      tab: 'videoTab',
      mark: 'Задание на видео',
      note: 'видео',
      steps: [
        { id: 'v-send', stage: 'create', el: 'send',
          done: { any: [{ clicked: 'v-send', within: 3600000 }, { exists: 'sent' }] },
          title: 'Запустите видео', keys: ['Enter'],
          say: 'Стрелка справа или Enter. Видео делается несколько минут.' },
        { id: 'v-download', stage: 'result', el: ['preview', 'download'], wait: 900000, download: true,
          title: 'Скачайте видео',
          say: 'Оцените результат и нажмите Скачать под роликом.' },
        { id: 'v-finish', stage: 'result', last: true,
          title: 'Готово',
          say: 'Видео в "Загрузках". В тренажёре нажмите Завершить.' },
      ],
    },
    site: {
      tab: 'webTab',
      mark: 'Задание на сайт',
      note: 'сайт',
      steps: [
        { id: 's-send', stage: 'create', el: 'send',
          done: { any: [{ clicked: 's-send', within: 3600000 }, { exists: 'sent' }] },
          title: 'Отправьте промт', keys: ['Enter'],
          say: 'Стрелка справа или Enter. Qwen соберёт сайт за пару минут.' },
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
