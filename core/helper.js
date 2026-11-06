// Помощник МАЯК: ядро. Читает карту сервиса (maps/*.js), понимает по состоянию страницы, на каком
// шаге человек, и показывает: белое кольцо на нужном месте, курсор с подписью, что сделать, и
// капсулу внизу с пояснением. Вид по Copilot Vision Highlights и ChatGPT Atlas (DESIGN.md).
// Страницу не блокирует: кольцо, курсор и метки не перехватывают клики, всё на сайте нажимается как обычно.
//
// Шаг карты:
//   el        имя элемента или список имён (берётся первый найденный); без el шаг только в капсуле;
//   title     подпись у курсора: что сделать; say — пояснение в капсуле;
//   keys      клавиши в подписи, например ['Ctrl', 'V'] (на Mac Ctrl показывается как ⌘);
//   skip      условие: шаг сейчас не нужен (уже вошёл, поле заполнено);
//   done      'click' или условие: шаг выполнен; выполненный шаг закрывает все шаги до него;
//   clickOn   какой элемент засчитывать для done: 'click', если обведён не он;
//   download  шаг закрывается, когда файл сохранился (сообщает core/background.js), а не по нажатию;
//   wait, host, stage, last (на последнем шаге кнопки "Вернуться в МАЯК" и "Показать файл").
// Условия: {exists}, {on}, {filled}, {url}, {clicked, within}, {not}, {any}, {all}.
//
// Путь (Simple, Advanced) — вкладка сервиса, которая сейчас выбрана. Перед путём шаг choose: кольцо
// на вкладках и метки под каждой, чем варианты отличаются; закрывается нажатием на любую вкладку.
// choose.buttons: вкладок нет, выбор кнопками в капсуле (label пути), например формат в Qwen.
(async () => {
  const host = location.hostname;
  const onHost = (h) => host === h || host.endsWith('.' + h);
  // Страница входа Google общая для всех сервисов: на ней карта того сервиса, где человек нажимал
  // последним (mayak:from пишется при нажатии на цель шага).
  const cands = (window.MAYAK_MAPS || []).filter((m) => m.hosts.some(onHost));
  if (!cands.length) return;
  const from = cands.length > 1 ? (await chrome.storage.local.get('mayak:from'))['mayak:from'] : null;
  const MAP = cands.find((m) => m.service === from) || cands[0];
  const PATHS = MAP.paths || {}; // у сервиса без режимов путей и шага выбора нет

  // ponytail: опрос раз в 0,5 с вместо MutationObserver, так проще пережить перерисовки SPA
  const TICK = 500;
  const LOST_AFTER = 6000;
  const LOST_NOTE = 'Не вижу кнопку: найдите её по описанию или пропустите шаг.';
  const COVERED_NOTE = 'Кнопку закрывает окно сайта: закройте его (крестик, Esc или клик рядом).';
  const COVERED_AFTER = 1200; // окно должно провисеть столько, мигание подсказок сайта не в счёт
  const KEY = 'mayak:' + MAP.service;
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform);
  const SAVING = 180000; // после нажатия "Скачать" столько ждём файл, потом снова обычная подсказка
  const fresh = () => ({ open: true, path: null, clicks: {}, done: {}, skipped: {}, file: null });

  let st = fresh();
  let curStep = null, curEl = null, curMarks = [], lostStep = null, lostSince = 0, lost = false;
  let coveredSince = 0, covered = false;
  let dockSig = '', scrolledFor = null;
  let rootHost, shadow, ui;

  const save = () => chrome.storage.local.set({ [KEY]: st });
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // --- элементы и условия карты ---

  // Текст сверяется раньше видимости: getComputedStyle дорогой, а текст отсеивает почти все кнопки.
  const RE = Object.fromEntries(Object.entries(MAP.elements).map(([n, d]) => [n, d.text ? new RegExp(d.text, 'i') : null]));
  const label = (e) => `${e.getAttribute('aria-label') || ''} ${e.textContent || ''}`.replace(/\s+/g, ' ').trim();
  const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';

  function el(names) {
    for (const n of [].concat(names || [])) {
      const d = MAP.elements[n];
      if (!d) continue;
      const re = RE[n];
      for (const x of document.querySelectorAll(d.css)) if ((!re || re.test(label(x))) && visible(x)) return x;
    }
    return null;
  }

  function test(c) {
    if (!c) return false;
    if (c.all) return c.all.every(test);
    if (c.any) return c.any.some(test);
    if (c.not) return !test(c.not);
    if (c.exists) return !!el(c.exists);
    if (c.url) return new RegExp(c.url).test(location.pathname);
    if (c.on) {
      const on = MAP.elements[c.on].on;
      return el(c.on)?.getAttribute(on.attr) === on.eq;
    }
    if (c.filled) {
      const e = el(c.filled);
      return !!e && !!(e.value ?? e.innerText).trim();
    }
    if (c.clicked) return Date.now() - (st.clicks[c.clicked] || 0) < (c.within ?? Infinity);
    return false;
  }

  // --- путь и шаги ---

  const selectedPath = () => Object.keys(PATHS).find((k) => test({ on: PATHS[k].tab })) || null;

  function steps() {
    const p = st.path && PATHS[st.path];
    return [...MAP.intro, ...(MAP.choose ? [{ id: 'choose', ...MAP.choose }] : []), ...(p ? p.steps : []), ...MAP.outro];
  }

  function current() {
    const list = steps();
    let from = 0;
    list.forEach((s, i) => {
      if (st.done[s.id] || st.skipped[s.id]) from = i + 1;
    });
    for (const s of list.slice(from)) {
      if (!onHost(s.host || MAP.home)) continue;
      if (s.done && s.done !== 'click' && test(s.done)) {
        complete(s);
        continue;
      }
      if (s.skip && test(s.skip)) continue;
      return s;
    }
    return null;
  }

  function followTab() {
    const sel = selectedPath();
    if (sel && sel !== st.path) {
      st.path = sel;
      save();
    }
  }

  // Нажал "Скачать" на шаге скачивания, файла ещё нет.
  const saving = (s) => !!s?.download && Date.now() - (st.clicks[s.id] || 0) < SAVING;

  function complete(s) {
    st.done[s.id] = Date.now();
    save();
  }

  // --- на экране: кольцо на цели, курсор с подписью, метки вариантов ---

  // Подписи вкладок режима видны на шаге выбора (крупные, mark) и на всех шагах выбранного пути (тихие,
  // note), чтобы человек в любой момент видел, что значит каждый режим, и мог переключиться.
  function marks() {
    if (!onHost(MAP.home) || !curStep) return [];
    const choose = curStep.id === 'choose';
    if (!choose && !PATHS[st.path]?.steps.includes(curStep)) return [];
    return Object.entries(PATHS)
      .map(([k, p]) => ({ e: el(p.tab), text: choose ? p.mark : p.note, quiet: !choose, on: k === st.path }))
      .filter((m) => m.e && m.text && shown(m.e).frac > 0.5);
  }
  const loud = () => curMarks.some((m) => !m.quiet);

  function placeNear(node, r, gap = 12) {
    node.hidden = false;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const below = r.bottom + gap + h < innerHeight;
    node.style.top = (below ? r.bottom + gap : Math.max(8, r.top - gap - h)) + 'px';
    node.style.left = Math.min(Math.max(8, r.left), innerWidth - w - 8) + 'px';
  }

  // Поле ввода обводится вместе со своей видимой рамкой сайта (скруглённый блок с фоном), а не голым textarea.
  function frameOf(e) {
    if (!/^(TEXTAREA|INPUT)$/.test(e.tagName) && e.getAttribute('role') !== 'textbox') return e;
    const r = e.getBoundingClientRect();
    for (let p = e.parentElement, i = 0; p && i < 6; p = p.parentElement, i++) {
      const q = p.getBoundingClientRect();
      // блок заметно больше поля — это уже панель сайта, а не рамка поля
      if (q.height - r.height > 80 || q.width - r.width > 80) break;
      const cs = getComputedStyle(p);
      if (parseFloat(cs.borderTopLeftRadius) > 8 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') return p;
    }
    return e;
  }

  // Видимая часть элемента: окно и все предки, которые обрезают содержимое (панели с прокруткой).
  // view — видимая область этих панелей: у её края встаёт стрелка, если цель уехала из вида.
  function shown(e) {
    const full = e.getBoundingClientRect();
    const view = { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p);
      if (o.overflowX === 'visible' && o.overflowY === 'visible') continue;
      const q = p.getBoundingClientRect();
      view.top = Math.max(view.top, q.top);
      view.bottom = Math.min(view.bottom, q.bottom);
      view.left = Math.max(view.left, q.left);
      view.right = Math.min(view.right, q.right);
    }
    const l = Math.max(full.left, view.left), t = Math.max(full.top, view.top);
    const w = Math.max(0, Math.min(full.right, view.right) - l), h = Math.max(0, Math.min(full.bottom, view.bottom) - t);
    return { r: new DOMRect(l, t, w, h), full, view, frac: (w * h) / Math.max(1, full.width * full.height) };
  }
  const HIDDEN = 0.35; // видно меньше трети цели — считаем, что она уехала

  // Светлый ли фон вокруг цели (смотрим родителей: кольцо лежит снаружи кнопки). На белых страницах,
  // как вход в Google, белое кольцо и белая подпись сливаются, там они тёмные.
  function lightAround(e) {
    for (let p = e.parentElement; p; p = p.parentElement) {
      const c = getComputedStyle(p).backgroundColor.match(/[\d.]+/g);
      if (c && (c[3] === undefined || +c[3] > 0.5)) return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 160;
    }
    return true; // фон страницы по умолчанию белый
  }

  const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const kbd = (s) => (s.keys || []).map((k) => `<kbd>${esc(MAC && k === 'Ctrl' ? '⌘' : k)}</kbd>`).join('');

  function renderLayer() {
    const s = curStep;
    const e = st.open ? curEl : null;
    const ms = st.open ? curMarks : [];

    const f = e && frameOf(e);
    const v = f && shown(f);
    // Цель уехала при прокрутке: вместо кольца стрелка у края панели, по нажатию прокрутит к цели.
    ui.edge.hidden = !(v && v.frac < HIDDEN);
    if (!ui.edge.hidden) {
      ui.root.classList.toggle('light', lightAround(f));
      const box = v.view;
      const up = (v.full.top + v.full.bottom) / 2 < (box.top + box.bottom) / 2;
      if (ui.edge.dataset.sig !== s.id + up) {
        ui.edge.dataset.sig = s.id + up;
        ui.edge.innerHTML = `${up ? UP : DOWN}<span>${esc(s.title)}</span>`;
        ui.edge.style.setProperty('--n', up ? '-3px' : '3px');
      }
      const w = ui.edge.offsetWidth;
      const h = ui.edge.offsetHeight;
      ui.edge.style.left = Math.min(Math.max(8, (box.left + box.right) / 2 - w / 2), innerWidth - w - 8) + 'px';
      ui.edge.style.top = (up ? Math.max(8, box.top + 10) : Math.min(innerHeight - h - 8, box.bottom - h - 10)) + 'px';
    }
    if (v && ui.edge.hidden) {
      // кольцо и курсор только по видимой части цели: панель сайта обрезает остальное
      const r = v.r;
      ui.root.classList.toggle('light', lightAround(f));
      // Кольцо повторяет форму цели; у мелких кнопок отступ меньше, чтобы не залезать на соседние.
      const pad = r.height < 48 ? 4 : 7;
      const radius = (parseFloat(getComputedStyle(f).borderTopLeftRadius) || 8) + pad;
      Object.assign(ui.ring.style, {
        transform: `translate(${r.left - pad}px, ${r.top - pad}px)`,
        width: r.width + pad * 2 + 'px',
        height: r.height + pad * 2 + 'px',
        borderRadius: Math.min(radius, (r.height + pad * 2) / 2) + 'px',
      });
      ui.ring.hidden = false;

      // Метки у вариантов сами подписывают цель: курсор с подписью им бы мешал.
      if (ms.some((m) => !m.quiet)) ui.pointer.hidden = true;
      else {
        if (ui.pointer.dataset.sig !== s.id) {
          ui.pointer.dataset.sig = s.id;
          ui.label.innerHTML = `<span>${esc(s.title)}</span>${kbd(s)}`;
        }
        // Кончик курсора внутри цели: в высоком поле левее центра, в кнопке правее, чтобы не закрыть надпись.
        const tall = r.height > 80;
        const x = r.left + r.width * (tall ? 0.42 : 0.62);
        const y = r.top + r.height * (tall ? 0.5 : 0.62);
        if (ui.pointer.hidden) {
          // Первый показ: курсор вылетает из капсулы к цели.
          const d = ui.dock.getBoundingClientRect();
          ui.pointer.classList.add('snap');
          ui.pointer.style.transform = `translate(${d.left + d.width / 2}px, ${d.top}px)`;
          ui.pointer.hidden = false;
          void ui.pointer.offsetWidth;
          ui.pointer.classList.remove('snap');
        }
        ui.pointer.style.transform = `translate(${x}px, ${y}px)`;
        // Подпись справа снизу от курсора; у края экрана переезжает влево или вверх.
        const w = ui.label.offsetWidth;
        const h = ui.label.offsetHeight;
        const dx = x + 18 + w > innerWidth - 8 ? -w - 8 : 18;
        const dy = y + 24 + h > innerHeight - 8 ? -h - 10 : 24;
        ui.label.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    } else {
      ui.ring.hidden = true;
      ui.pointer.hidden = true;
    }

    while (ui.marks.children.length > ms.length) ui.marks.lastChild.remove();
    // Бирка по центру своей вкладки, хвостик в её центр. Вкладки узкие (Simple, Advanced), а бирки
    // широкие: если соседние налезают, ряд бирок ставится группой по центру вкладок, а хвостики
    // остаются на своих бирках и смотрят в сторону своей вкладки.
    const GAP = 6;
    const placed = ms
      .map((m, i) => {
        const node = ui.marks.children[i] || ui.marks.appendChild(document.createElement('div'));
        node.className = 'mark' + (m.quiet ? ' quiet' : '') + (m.quiet && m.on ? ' on' : '');
        node.textContent = m.text;
        const r = m.e.getBoundingClientRect();
        placeNear(node, r, 6);
        const w = node.offsetWidth;
        return { node, r, w, mid: r.left + r.width / 2 };
      })
      .sort((a, b) => a.mid - b.mid);
    const overlap = placed.some((p, i) => i && p.mid - p.w / 2 < placed[i - 1].mid + placed[i - 1].w / 2 + GAP);
    const total = placed.reduce((n, p) => n + p.w, 0) + GAP * Math.max(0, placed.length - 1);
    const center = placed.length ? (placed[0].r.left + placed[placed.length - 1].r.right) / 2 : 0;
    let x = Math.min(Math.max(8, center - total / 2), innerWidth - total - 8);
    for (const p of placed) {
      const left = overlap ? x : Math.min(Math.max(8, p.mid - p.w / 2), innerWidth - p.w - 8);
      p.node.style.left = left + 'px';
      p.node.style.setProperty('--tail', Math.min(Math.max(14, p.mid - left), p.w - 14) + 'px');
      x += p.w + GAP;
    }
  }

  let rafPending = false;
  const reposition = () => {
    if (rafPending || !ui) return;
    rafPending = true;
    ui.root.classList.add('snap');
    requestAnimationFrame(() => {
      rafPending = false;
      renderLayer();
      requestAnimationFrame(() => ui.root.classList.remove('snap'));
    });
  };

  // --- капсула ---

  const SVG = (d, size = 20) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const LIGHTHOUSE = SVG('<path d="M9 21l1-11h4l1 11z"/><path d="M9.5 10h5"/><path d="M10.5 6h3v4h-3z"/><path d="M12 3v3"/><path d="M4.5 5.5l3 1.2M19.5 5.5l-3 1.2"/><path d="M6 21h12"/>', 17);
  const UP = SVG('<path d="M7 14l5-5 5 5"/>', 18);
  const DOWN = SVG('<path d="M7 10l5 5 5-5"/>', 18);
  const AGAIN = SVG('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>', 18);
  const CURSOR =
    '<svg viewBox="0 0 28 28" width="30" height="30" aria-hidden="true"><path d="M6 3.5v19.2l5-4.9 3.3 7.6 3.6-1.5-3.3-7.5h7z" fill="#fff" stroke="#0b0b0c" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  // Кольцо вокруг маяка показывает долю пройденных этапов.
  function badge(s) {
    const i = MAP.stages.findIndex((x) => x.id === s?.stage);
    const part = !s ? 1 : (i + 1) / MAP.stages.length;
    const c = 2 * Math.PI * 16;
    const title = s && i >= 0 ? `Этап ${i + 1} из ${MAP.stages.length}: ${MAP.stages[i].title}` : 'Помощник МАЯК';
    return (
      `<span class="badge" title="${esc(title)}" role="img" aria-label="${esc(title)}">` +
      '<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" class="track"/>' +
      `<circle cx="18" cy="18" r="16" class="fill" stroke-dasharray="${(c * part).toFixed(1)} ${c.toFixed(1)}"/></svg>` +
      `${LIGHTHOUSE}</span>`
    );
  }

  function dockHtml(s) {
    if (!st.open) {
      return `<button class="dock glass min" data-a="open" aria-label="Открыть помощника">${badge(s)}<span>Помощник МАЯК</span>${UP}</button>`;
    }
    // Пока курсор стоит на цели, его подпись уже говорит, что сделать: в капсуле только пояснение.
    let text;
    if (!s) text = '<b>Помощник МАЯК</b><span>Подсказки появятся, когда понадобятся.</span>';
    else if (saving(s)) text = '<b>Сохраняем файл</b><span>Как только файл скачается, покажу, что дальше.</span>';
    else if (lost) text = `<b>${esc(s.title)}</b><span class="warn">${esc(LOST_NOTE)}</span>`;
    else if (covered) text = `<b>${esc(s.title)}</b><span class="warn">${esc(COVERED_NOTE)}</span>`;
    else if (curEl && !loud()) text = `<span class="say">${esc(s.say)}</span>`;
    else text = `<b>${esc(s.title)}</b><span>${esc(s.say)}</span>`;
    const btns = [];
    const pick = s?.id === 'choose' && MAP.choose.buttons;
    if (pick) for (const [k, p] of Object.entries(PATHS)) btns.push(`<button class="text" data-a="path" data-k="${esc(k)}">${esc(p.label)}</button>`);
    if (s?.last && st.file) btns.push(`<button class="text" data-a="file" title="${esc(st.file.name)}">Показать файл</button>`);
    if (s?.last) btns.push('<button class="primary" data-a="back">Вернуться в МАЯК</button>');
    if (s?.last) btns.push(`<button class="icon" data-a="restart" aria-label="Начать заново" title="Начать заново">${AGAIN}</button>`);
    if (s && !s.last && !pick) btns.push('<button class="text" data-a="skip">Пропустить</button>');
    btns.push(`<button class="icon" data-a="close" aria-label="Свернуть помощника">${DOWN}</button>`);
    return `<div class="dock glass">${badge(s)}<div class="txt">${text}</div><div class="btns">${btns.join('')}</div></div>`;
  }

  function renderDock(s) {
    // На чужих страницах (вход в Google) помощник молчит, пока там нет его шага.
    const html = onHost(MAP.home) || s ? dockHtml(s) : '';
    if (html !== dockSig) {
      dockSig = html;
      ui.dock.innerHTML = html;
    }
    // Капсула уходит наверх, только пока нужная кнопка лежит под ней.
    ui.dock.classList.remove('up');
    const b = ui.dock.getBoundingClientRect();
    const r = curEl?.getBoundingClientRect();
    ui.dock.classList.toggle('up', !!r && r.right > b.left && r.left < b.right && r.bottom > b.top && r.top < b.bottom);
  }

  function set(patch) {
    Object.assign(st, patch);
    save();
    tick();
  }

  function onClick(ev) {
    const b = ev.target.closest('[data-a]');
    const a = b?.dataset.a;
    if (a === 'path' && PATHS[b.dataset.k]) {
      st.path = b.dataset.k;
      st.done.choose = Date.now();
      return set({});
    }
    if (a === 'open') return set({ open: true });
    if (a === 'close') return set({ open: false });
    if (a === 'skip') {
      if (curStep) st.skipped[curStep.id] = true;
      return set({});
    }
    if (a === 'restart') {
      st = fresh();
      return set({});
    }
    if (a === 'reveal') curEl?.scrollIntoView({ behavior: smooth(), block: 'center' });
    if (a === 'back') chrome.runtime.sendMessage({ type: 'mayak:back' });
    if (a === 'file' && st.file) chrome.runtime.sendMessage({ type: 'mayak:show', id: st.file.id });
  }

  function mount() {
    rootHost = document.createElement('div');
    rootHost.id = 'mayak-helper-root';
    shadow = rootHost.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      `<style>${CSS}</style><div class="root">` +
      '<div class="ring" hidden></div><div class="marks"></div>' +
      `<div class="pointer" hidden>${CURSOR}<div class="label"></div></div>` +
      '<button class="edge" data-a="reveal" hidden></button><div class="dock-wrap"></div></div>';
    ui = {
      root: shadow.querySelector('.root'),
      ring: shadow.querySelector('.ring'),
      marks: shadow.querySelector('.marks'),
      pointer: shadow.querySelector('.pointer'),
      label: shadow.querySelector('.label'),
      edge: shadow.querySelector('.edge'),
      dock: shadow.querySelector('.dock-wrap'),
    };
    // Капсула не закрывает собственные панели сервиса (у Suno внизу плеер); на чужих страницах у края.
    ui.dock.style.setProperty('--dock', ((onHost(MAP.home) && MAP.dock) || 24) + 'px');
    shadow.addEventListener('click', onClick);
    document.body.append(rootHost);
    addEventListener('scroll', reposition, { capture: true, passive: true });
    addEventListener('resize', reposition, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden || tick());
  }

  // --- цикл ---

  function tick() {
    // Вкладка не на экране: проверять нечего, помощник не тратит процессор.
    if (document.hidden) return;
    if (!rootHost.isConnected) document.body.append(rootHost);
    if (onHost(MAP.home)) followTab();
    const s = current();
    // Пока файл сохраняется, кольцо не нужно: запасные цели шага (три точки) звали бы нажать ещё раз.
    const e = s?.el && !saving(s) ? el(s.el) : null;
    if (s !== lostStep || e) {
      lostStep = s;
      lostSince = Date.now();
    }
    // Пока файл сохраняется, кнопка "Скачать" могла пропасть (меню закрылось): это не потеря.
    lost = !!s?.el && !e && !saving(s) && Date.now() - lostSince > (s.wait ?? LOST_AFTER);
    // Нужная кнопка за краем экрана или под плавающей панелью сайта (у Suno поле стиля уходит
    // под кнопку Create): один раз на шаг прокрутить к ней.
    if (e && st.open && scrolledFor !== s) {
      scrolledFor = s;
      const r = e.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const covered = !!hit && hit !== rootHost && !e.contains(hit) && !hit.contains(e);
      if (shown(frameOf(e)).frac < HIDDEN || covered) e.scrollIntoView({ behavior: smooth(), block: 'center' });
    }
    // Цель под окном сайта (Gamma 5, реклама, опрос): кольцо на ней есть, а нажать нельзя, сказать.
    // Своя подпись поля или иконка внутри того же блока не в счёт: окно сайта лежит вне блока цели.
    if (e && st.open) {
      const r = e.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const over = !!hit && hit !== rootHost && !(e.parentElement || e).contains(hit) && !hit.contains(e);
      if (!over) coveredSince = 0;
      else if (!coveredSince) coveredSince = Date.now();
      covered = over && Date.now() - coveredSince > COVERED_AFTER;
    } else covered = false;
    curStep = s;
    curEl = e;
    curMarks = marks();
    renderDock(s);
    renderLayer();
  }

  // pointerdown, а не click: кнопка входа уводит со страницы раньше, чем успеет сохраниться click.
  document.addEventListener(
    'pointerdown',
    (ev) => {
      for (const [k, p] of Object.entries(PATHS)) {
        if (el(p.tab)?.contains(ev.target)) {
          st.path = k;
          save();
        }
      }
      const s = curStep;
      if (!s) return;
      const target = s.clickOn ? el(s.clickOn) : curEl;
      if (!target?.contains(ev.target)) return;
      st.clicks[s.id] = Date.now();
      chrome.storage.local.set({ 'mayak:from': MAP.service });
      if (s.done === 'click') complete(s);
      else save();
    },
    true,
  );

  // Файл сохранился (core/background.js шлёт всем вкладкам). Берёт вкладка, где человек на этапе
  // шага скачивания: закрывается этот шаг и все до него, на последнем шаге появляется "Показать файл".
  chrome.runtime.onMessage.addListener((m) => {
    if (m.type !== 'mayak:file') return;
    const dl = steps().findLast((x) => x.download);
    if (!dl || !curStep || curStep.stage !== dl.stage) return;
    st.file = m.file;
    complete(dl);
    if (rootHost) tick();
  });

  chrome.storage.onChanged.addListener((ch) => {
    if (!ch[KEY]) return;
    st = { ...fresh(), ...ch[KEY].newValue };
    if (rootHost) tick();
  });

  chrome.storage.local.get(KEY).then((r) => {
    if (r[KEY]) st = { ...fresh(), ...r[KEY] };
    mount();
    setInterval(tick, TICK);
    tick();
  });

  // Белое на тёмном стекле: на тёмных сайтах вроде Suno выглядит родным, на светлых (Google) держится
  // тёмным контуром кольца и тенью. Подпись у курсора белая, как пилюли самого Suno.
  const CSS = `
:host { all: initial; }
.root { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; color: #f5f5f7; font-family: "Mayak Manrope", system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
[hidden] { display: none !important; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; pointer-events: auto; }
button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.glass { background: rgba(30, 30, 32, 0.9); -webkit-backdrop-filter: blur(24px) saturate(180%); backdrop-filter: blur(24px) saturate(180%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 16px 40px rgba(0, 0, 0, 0.45); }

.ring { position: absolute; left: 0; top: 0; box-sizing: border-box; border: 3px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(0, 0, 0, 0.55), 0 0 0 7px rgba(255, 255, 255, 0.16), 0 0 36px 6px rgba(255, 255, 255, 0.38); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.ring::after { content: ""; position: absolute; inset: -4px; border-radius: inherit; animation: wave 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
@keyframes wave { 0%, 30% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55); } 100% { box-shadow: 0 0 0 18px rgba(255, 255, 255, 0); } }

.pointer { position: absolute; left: 0; top: 0; transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1); }
.pointer svg { position: absolute; left: -6px; top: -3px; filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.45)); transform-origin: 6px 4px; animation: press 2.4s ease-in-out infinite; }
@keyframes press { 0%, 16%, 38%, 100% { transform: none; } 27% { transform: scale(0.82); } }
.label { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 6px; min-height: 40px; box-sizing: border-box; padding: 8px 16px; border-radius: 20px; background: #fff; color: #0b0b0c; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 10px 30px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.label:has(kbd) { padding-right: 8px; }
.label span { margin-right: 4px; }
kbd { display: inline-grid; place-items: center; min-width: 26px; height: 24px; box-sizing: border-box; padding: 0 7px; border-radius: 7px; font: 700 12px/1 "Mayak Manrope", system-ui, sans-serif; color: #3a3a3c; background: #efeff1; box-shadow: inset 0 -1.5px 0 #d6d6d9; }
.light .ring { border-color: #0b0b0c; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 0 7px rgba(11, 11, 12, 0.1), 0 0 30px 4px rgba(11, 11, 12, 0.22); }
.light .ring::after { animation-name: wave-dark; }
@keyframes wave-dark { 0%, 30% { box-shadow: 0 0 0 0 rgba(11, 11, 12, 0.35); } 100% { box-shadow: 0 0 0 18px rgba(11, 11, 12, 0); } }
.light .pointer path { fill: #0b0b0c; stroke: #fff; }
.light .label { background: #0b0b0c; color: #fff; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.2); }
.light kbd { color: #fff; background: rgba(255, 255, 255, 0.16); box-shadow: inset 0 -1.5px 0 rgba(0, 0, 0, 0.5); }
.snap .ring, .snap .pointer, .snap .label, .pointer.snap, .pointer.snap .label { transition: none; }

.edge { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 8px; height: 42px; box-sizing: border-box; padding: 0 18px 0 12px; border-radius: 21px; background: #fff; color: #0b0b0c; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25); animation: nudge 1.6s ease-in-out infinite; }
.edge:hover { background: #f2f2f7; }
.light .edge { background: #0b0b0c; color: #fff; }
@keyframes nudge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--n, -3px)); } }
.mark.quiet { padding: 4px 10px; font-size: 12.5px; font-weight: 700; color: rgba(255, 255, 255, 0.72); background: rgba(18, 18, 20, 0.86); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32); }
.mark.quiet::before { content: ""; position: absolute; left: var(--tail, 50%); top: -4px; width: 7px; height: 7px; margin-left: -4px; transform: rotate(45deg); background: rgb(18, 18, 20); box-shadow: -1px -1px 0 rgba(255, 255, 255, 0.32); }
.mark.quiet.on { color: #fff; box-shadow: inset 0 0 0 1.5px #fff; }
.mark.quiet.on::before { box-shadow: -1.5px -1.5px 0 #fff; }
.mark { position: absolute; padding: 6px 12px; border-radius: 999px; font-size: 13.5px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; color: #0b0b0c; background: #fff; white-space: nowrap; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25); }
.mark:not(.quiet)::before { content: ""; position: absolute; left: var(--tail, 50%); top: -4px; width: 8px; height: 8px; margin-left: -4px; transform: rotate(45deg); background: #fff; }

.dock-wrap { position: absolute; left: 50%; bottom: var(--dock, 24px); transform: translateX(-50%); max-width: calc(100vw - 24px); width: max-content; pointer-events: auto; }
.dock-wrap.up { bottom: auto; top: 12px; }
.dock { display: flex; align-items: center; gap: 12px; box-sizing: border-box; min-height: 52px; padding: 6px 6px 6px 8px; border-radius: 26px; }
.badge { position: relative; flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: #fff; background: rgba(255, 255, 255, 0.08); }
.badge svg:first-child { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.badge svg:last-child { position: relative; }
.badge circle { fill: none; stroke-width: 2.5; }
.badge .track { stroke: rgba(255, 255, 255, 0.16); }
.badge .fill { stroke: #fff; stroke-linecap: round; transition: stroke-dasharray 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.txt { min-width: 0; display: flex; flex-direction: column; gap: 1px; padding-right: 2px; }
.txt b { font-size: 15px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; color: #fff; }
.txt span { max-width: 60ch; font-size: 14.5px; font-weight: 500; line-height: 1.35; color: #c7c7cc; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.txt span.say { color: #e5e5ea; }
.txt span.warn { color: #ffb340; }
.btns { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.text, .primary { height: 40px; padding: 0 16px; border-radius: 20px; font-size: 14.5px; font-weight: 600; transition: background 0.15s; }
.text { color: #f2f2f7; background: rgba(255, 255, 255, 0.1); }
.text:hover { background: rgba(255, 255, 255, 0.18); }
.primary { font-weight: 700; color: #0b0b0c; background: #fff; }
.primary:hover { background: #e5e5ea; }
.icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: #e5e5ea; background: rgba(255, 255, 255, 0.1); transition: background 0.15s; }
.icon:hover { background: rgba(255, 255, 255, 0.18); }
.dock.min { gap: 8px; padding: 6px 14px 6px 6px; font-size: 14.5px; font-weight: 700; color: #fff; }

@media (prefers-reduced-motion: reduce) {
  .ring, .pointer, .label, .badge .fill { transition: none; }
  .ring::after, .pointer svg, .edge { animation: none; }
}
`;
})();
