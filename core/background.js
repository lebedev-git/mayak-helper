// Помощник МАЯК: фон. Две задачи, сетевых запросов нет.
// 1. Скачивания: когда файл сохранился, сообщает вкладкам сервисов имя файла, и шаг "Скачайте"
//    закрывается по настоящему файлу, а не по нажатию. Кнопка "Показать файл" открывает его в папке.
// 2. "Вернуться в МАЯК": переключает на открытую вкладку тренажёра (ту, откуда открыли сервис, иначе
//    последнюю на rosdk.ru); новую открывает, только если тренажёра нет ни в одной вкладке.
const TRAINER = ['https://rosdk.ru/*', 'https://*.rosdk.ru/*'];
const TRAINER_URL = 'https://rosdk.ru/tools/mayak-oko';

chrome.downloads.onChanged.addListener(async (d) => {
  if (d.state?.current !== 'complete') return;
  const [item] = await chrome.downloads.search({ id: d.id });
  if (!item) return;
  const file = { id: item.id, name: item.filename.split(/[\\/]/).pop(), at: Date.now() };
  // ponytail: всем вкладкам, принимает та, где помощник на шаге результата; без поиска "чья" вкладка
  for (const t of await chrome.tabs.query({})) chrome.tabs.sendMessage(t.id, { type: 'mayak:file', file }).catch(() => {});
});

async function back(from) {
  const tabs = await chrome.tabs.query({ url: TRAINER });
  const t = tabs.find((x) => x.id === from?.openerTabId) || tabs.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
  if (!t) return chrome.tabs.create({ url: TRAINER_URL, index: (from?.index ?? 0) + 1 });
  await chrome.tabs.update(t.id, { active: true });
  await chrome.windows.update(t.windowId, { focused: true });
}

chrome.runtime.onMessage.addListener((m, sender) => {
  if (m.type === 'mayak:back') back(sender.tab);
  if (m.type === 'mayak:show') chrome.downloads.show(m.id);
});
