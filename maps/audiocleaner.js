// Карта Audiocleaner (audiocleaner.ai/ru). Только данные: ядро её читает, кода здесь нет. Элементы ищутся
// по видимому тексту и aria-label; где их нет (кнопка Play, окно обработки), по смысловым классам BEM,
// хешированных классов нет. Шаги по инструкции тренажёра (data/mayak-service-templates/audiocleaner.pptx):
// вход через Google, загрузка, Улучшить медиа, Скачать результат, сдача в тренажёре.
// Сверено с живым сервисом 05.11.2026, без входа.
// title: подпись у курсора, коротко, что сделать; say: пояснение в капсуле, не длиннее 60 знаков.
//
// Без входа сервис чистит и даёт послушать только первую минуту записи, кнопки скачивания нет
// ("Войти для полного улучшения"). Поэтому, как в инструкции к заданиям, сначала вход через Google.
// Шаги очистки идут по состоянию страницы, а не по нажатиям: если после входа сервис вернёт на
// главную, помощник снова покажет загрузку.
{
// Страницы Google: шаги видны, только если человек за последние 15 минут нажал "Войти" в Audiocleaner
// (в шапке или у результата). Блок, а не верхний уровень: const карт живут в общем мире content scripts.
const fromHere = { any: [{ clicked: 'login', within: 900000 }, { clicked: 'full-login', within: 900000 }] };

(window.MAYAK_MAPS ||= []).push({
  service: 'audiocleaner',
  name: 'Audiocleaner',
  hosts: ['audiocleaner.ai', 'accounts.google.com'],
  home: 'audiocleaner.ai',

  elements: {
    login: { css: 'button', text: '^войти$' }, // в шапке; у окна входа своя кнопка "Войти" ниже по DOM
    credits: { css: 'button, a', text: 'бесплатные кредиты' }, // в шапке после входа (скриншот инструкции)
    // Кнопка Google нарисована в чужом iframe: нажатие в нём странице не видно, поэтому шаги Google
    // ниже ждут нажатия на "Войти" в шапке, а не на эту кнопку.
    google: { css: 'iframe[src*="accounts.google.com/gsi/button"]' },
    gAccount: { css: '[data-identifier]' },
    gEmail: { css: 'input[name=identifier], input[type=email]' },
    gPassword: { css: 'input[name=Passwd], input[type=password]' },
    gNext: { css: 'button', text: '^(далее|next)$' },
    gContinue: { css: 'button', text: '^(продолжить|continue)$' },
    device: { css: 'button', text: '^мое устройство$' },
    fileCard: { css: 'button[aria-label^="Remove "]' }, // корзина у загруженного файла
    enhance: { css: 'button', text: '^улучшить медиа$' },
    busy: { css: '.progress-overlay' }, // проверка файла, очередь и обработка
    result: { css: '.result-btn' }, // кнопки под "Финальный результат"
    fullLogin: { css: '.result-btn', text: 'войти для полного' },
    download: { css: '.result-btn', text: 'скачать' },
    downloadAny: { css: 'button, a', text: '^скачать результат' },
  },

  stages: [
    { id: 'login', title: 'Вход' },
    { id: 'clean', title: 'Очистка' },
    { id: 'result', title: 'Результат' },
  ],

  intro: [
    { id: 'login', stage: 'login', el: 'login',
      skip: { any: [{ exists: 'credits' }, { not: { exists: 'login' } }, { exists: 'google' }] },
      title: 'Нажмите Войти',
      say: 'Без входа сервис чистит только первую минуту записи.' },
    { id: 'google', stage: 'login', el: 'google',
      skip: { any: [{ exists: 'credits' }, { not: { exists: 'login' } }, { not: { exists: 'google' } }] },
      title: 'Нажмите Вход через Google',
      say: 'Вход через Google: отдельный пароль не нужен.' },
    // Какая страница Google открыта, видно по полю на ней; последний шаг без цели — запасной.
    { id: 'g-account', stage: 'login', host: 'accounts.google.com', el: 'gAccount',
      skip: { any: [{ not: fromHere }, { not: { exists: 'gAccount' } }] },
      title: 'Нажмите свой аккаунт',
      say: 'Аккаунт Google, через который входите в Audiocleaner.' },
    { id: 'g-email', stage: 'login', host: 'accounts.google.com', el: 'gEmail',
      skip: { any: [{ not: fromHere }, { not: { exists: 'gEmail' } }, { filled: 'gEmail' }] },
      title: 'Введите почту Gmail',
      say: 'Адрес почты, например ivanov@gmail.com.' },
    { id: 'g-email-next', stage: 'login', host: 'accounts.google.com', el: 'gNext',
      skip: { any: [{ not: fromHere }, { not: { exists: 'gEmail' } }] },
      title: 'Нажмите Далее',
      say: 'Google проверит адрес и попросит пароль.' },
    { id: 'g-password', stage: 'login', host: 'accounts.google.com', el: 'gPassword',
      skip: { any: [{ not: fromHere }, { not: { exists: 'gPassword' } }, { filled: 'gPassword' }] },
      title: 'Введите пароль',
      say: 'Пароль от почты Gmail. Его видите только вы.' },
    { id: 'g-password-next', stage: 'login', host: 'accounts.google.com', el: 'gNext',
      skip: { any: [{ not: fromHere }, { not: { exists: 'gPassword' } }] },
      title: 'Нажмите Далее',
      say: 'После входа Google вернёт вас в Audiocleaner.' },
    { id: 'g-continue', stage: 'login', host: 'accounts.google.com', el: 'gContinue',
      skip: { any: [{ not: fromHere }, { not: { exists: 'gContinue' } }] },
      title: 'Нажмите Продолжить',
      say: 'Google спрашивает разрешение войти в Audiocleaner.' },
    { id: 'google-account', stage: 'login', host: 'accounts.google.com',
      skip: { not: fromHere },
      title: 'Войдите в аккаунт Google',
      say: 'Следуйте шагам Google, потом вернётесь в Audiocleaner.' },
    { id: 'upload', stage: 'clean', el: 'device',
      skip: { any: [{ exists: 'fileCard' }, { exists: 'busy' }, { exists: 'result' }] },
      title: 'Загрузите файл',
      say: 'Файл задания в папке Загрузки. Можно перетащить в рамку.' },
    { id: 'enhance', stage: 'clean', el: 'enhance',
      skip: { any: [{ exists: 'busy' }, { exists: 'result' }] },
      title: 'Нажмите Улучшить медиа',
      say: 'Шум уже выбран. Ветер на записи? Нажмите Удалить шум ветра.' },
  ],


  outro: [
    { id: 'processing', stage: 'clean',
      skip: { not: { exists: 'busy' } },
      title: 'Подождите',
      say: 'Идёт очистка. Бывает долгая очередь: ждите, не платите.' },
    { id: 'full-login', stage: 'result', el: 'fullLogin',
      skip: { not: { exists: 'fullLogin' } },
      title: 'Войдите, чтобы скачать',
      say: 'Без входа готова только первая минута записи.' },
    { id: 'download', stage: 'result', el: ['download', 'downloadAny'], download: true,
      title: 'Скачайте результат',
      say: 'Файл сохранится в папку Загрузки. Можно сначала послушать.' },
    { id: 'finish', stage: 'result', last: true,
      title: 'Готово',
      say: 'В тренажёре нажмите Завершить и загрузите файл.' },
  ],
});
}
