// Карта Z.ai (chat.z.ai; z.ai перенаправляет сюда). Только данные: ядро её читает, кода здесь нет.
// Элементы ищутся по видимому тексту, id и aria-label: CSS-классы Z.ai меняются.
// Шаги по инструкции Z.ai на сайте тренажёра (data/mayak-service-templates/zai.pptx): вход через
// Google, промт в обычный чат, готовый сайт в панели справа, Share и Copy Link, ссылку в тренажёр.
// Сверено с живым Z.ai 05.11.2026 до отправки промта и на готовом сайте (Share); окошко Copy Link
// по скриншоту инструкции, его не открывали: Share публикует сайт по открытой ссылке.
// title: подпись у курсора, коротко, что сделать; say: пояснение в капсуле, не длиннее 60 знаков.
(window.MAYAK_MAPS ||= []).push({
  service: 'zai',
  name: 'Z.ai',
  hosts: ['chat.z.ai', 'accounts.google.com'],
  home: 'chat.z.ai',
  // Капсула над полем ввода: под ним 34 px, а в его нижнем ряду кнопка выбранного режима.
  dock: 206,

  elements: {
    // в боковой панели есть невидимая копия кнопки (opacity 0), нужна верхняя, она в nav
    signIn: { css: 'nav button', text: '^sign in$' },
    signInDialog: { css: '[role=dialog] button', text: '^sign in$' }, // окно "Sign in to start chatting"
    google: { css: 'button', text: '^continue with google$' },
    gAccount: { css: '[data-identifier]' },
    gEmail: { css: 'input[name=identifier], input[type=email]' },
    gPassword: { css: 'input[name=Passwd], input[type=password]' },
    gNext: { css: 'button', text: '^(далее|next)$' },
    gContinue: { css: 'button', text: '^(продолжить|continue)$' },
    // Тур для новых аккаунтов (driver.js): его затемнение перехватывает клики по всей странице.
    tour: { css: '#driver-popover-content button[aria-label=Close]' },
    promo: { css: 'button', text: '^maybe later$' }, // окно рекламы тарифа с Buy Now
    prompt: { css: 'textarea#chat-input' },
    send: { css: '#send-message-button' },
    htmlCard: { css: '[role=button]', text: '^html ' }, // карточка "HTML Generate index.html" в ответе
    // Share над готовым сайтом, в окошке Copy Link (ссылка вида chat.z.ai/space/...-art).
    // Вверху окна есть вторая Share (делится перепиской); у нужной data-state всплывающего окошка.
    share: { css: 'button[data-state]', text: '^share$' },
    copyLink: { css: 'button, [role=button], [role=menuitem], [tabindex]', text: '^(copy link|copied!)$' },
  },

  stages: [
    { id: 'login', title: 'Вход' },
    { id: 'create', title: 'Запуск' },
    { id: 'result', title: 'Результат' },
  ],

  intro: [
    { id: 'login', stage: 'login', el: ['signInDialog', 'signIn'],
      skip: { not: { any: [{ exists: 'signIn' }, { exists: 'signInDialog' }] } },
      title: 'Нажмите Sign in',
      say: 'Без входа Z.ai не делает сайты. Кнопка вверху справа.' },
    { id: 'google', stage: 'login', el: 'google',
      skip: { not: { exists: 'google' } },
      title: 'Нажмите Continue with Google',
      say: 'Вход через Google: отдельный пароль для Z.ai не нужен.' },
    // Страницы Google: шаг виден только если человек пришёл из Z.ai (нажал Continue with Google за
    // последние 15 минут). Последний шаг без цели — запасной для всего, что Google покажет ещё.
    { id: 'g-account', stage: 'login', host: 'accounts.google.com', el: 'gAccount',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gAccount' } }] },
      title: 'Нажмите свой аккаунт',
      say: 'Аккаунт Google, через который входите в Z.ai.' },
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
      say: 'После входа Google вернёт вас в Z.ai.' },
    { id: 'g-continue', stage: 'login', host: 'accounts.google.com', el: 'gContinue',
      skip: { any: [{ not: { clicked: 'google', within: 900000 } }, { not: { exists: 'gContinue' } }] },
      title: 'Нажмите Продолжить',
      say: 'Google спрашивает разрешение войти в Z.ai.' },
    { id: 'google-account', stage: 'login', host: 'accounts.google.com',
      skip: { not: { clicked: 'google', within: 900000 } },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в Z.ai.' },
    { id: 'tour', stage: 'create', el: 'tour',
      skip: { not: { exists: 'tour' } },
      title: 'Закройте подсказку',
      say: 'Подсказка Z.ai мешает нажимать. Закройте крестик.' },
    { id: 'promo', stage: 'create', el: 'promo',
      skip: { not: { exists: 'promo' } },
      title: 'Нажмите Maybe Later',
      say: 'Это реклама платного тарифа, для занятия он не нужен.' },
  ],


  // Шаги 4 инструкции: вставить промт, запустить, дождаться, проверить сайт и скопировать ссылку.
  outro: [
    { id: 'prompt', stage: 'create', el: 'prompt',
      skip: { filled: 'prompt' },
      title: 'Вставьте промт', keys: ['Ctrl', 'V'],
      say: 'Нажмите в поле и вставьте промт из тренажёра.' },
    { id: 'send', stage: 'create', el: 'send', done: 'click',
      title: 'Отправьте промт',
      say: 'Z.ai напишет сайт за несколько минут. Дождитесь ответа.' },
    // Сайт открывается в панели справа; если её закрыли, она открывается карточкой HTML в ответе.
    { id: 'open', stage: 'result', el: 'htmlCard',
      skip: { any: [{ exists: 'share' }, { not: { exists: 'htmlCard' } }] },
      title: 'Откройте сайт',
      say: 'Нажмите карточку HTML в ответе: сайт откроется справа.' },
    { id: 'share', stage: 'result', el: 'share', wait: 900000,
      done: { exists: 'copyLink' },
      title: 'Нажмите Share',
      say: 'Проверьте сайт справа, затем нажмите Share над ним.' },
    { id: 'copy', stage: 'result', el: 'copyLink', done: 'click',
      title: 'Нажмите Copy Link',
      say: 'Ссылка на сайт скопируется: её сдают в тренажёр.' },
    { id: 'finish', stage: 'result', last: true,
      title: 'Готово',
      say: 'Вернитесь в тренажёр, нажмите Завершить, вставьте ссылку.' },
  ],
});
