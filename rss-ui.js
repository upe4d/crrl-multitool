(() => {
  'use strict';
  const key = 'multitool-rss-sources-v1';
  const panel = document.querySelector('#rssPanel');
  if (!panel) return;
  const list = document.querySelector('#rssSources');
  const status = document.querySelector('#rssStatus');
  const input = document.querySelector('#rssAddress');
  const refresh = document.querySelector('#rssRefresh');
  let sources = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) sources = saved.filter(x => x && typeof x.url === 'string' && typeof x.title === 'string').slice(0, 6);
  } catch { status.textContent = 'Не удалось прочитать сохранённые источники'; }
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(sources)); return true; }
    catch { status.textContent = 'Не удалось сохранить источники в браузере'; return false; }
  }
  function renderSources() {
    list.replaceChildren();
    if (!sources.length) { const empty = document.createElement('p'); empty.className = 'helper'; empty.textContent = 'Источников пока нет'; list.append(empty); }
    sources.forEach((source, index) => {
      const item = document.createElement('div'); item.className = 'rss-source';
      const label = document.createElement('label');
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = source.enabled !== false;
      check.addEventListener('change', () => { source.enabled = check.checked; persist(); });
      const name = document.createElement('span'); name.textContent = source.title; name.title = source.url;
      label.append(check, name);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Удалить источник ' + source.title);
      remove.addEventListener('click', () => { sources.splice(index, 1); persist(); renderSources(); });
      item.append(label, remove); list.append(item);
    });
  }
  async function load(urls) {
    const response = await fetch('./api/rss/', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({urls})});
    let data;
    try { data = await response.json(); } catch { throw new Error('Сервис RSS вернул некорректный ответ'); }
    if (!response.ok) throw new Error(data.error || 'Не удалось получить источники');
    return data;
  }
  document.querySelectorAll('[data-news-mode]').forEach(button => button.addEventListener('click', () => {
    const rss = button.dataset.newsMode === 'rss';
    panel.classList.toggle('hidden', !rss); document.querySelector('#newsForm').classList.toggle('hidden', rss);
    document.querySelectorAll('[data-news-mode]').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  }));
  document.querySelector('#rssAdd').addEventListener('submit', async event => {
    event.preventDefault();
    if (sources.length >= 6) { status.textContent = 'Можно добавить не больше 6 источников'; return; }
    let url;
    try { url = new URL(input.value.trim()); if (!['https:', 'http:'].includes(url.protocol)) throw Error(); }
    catch { status.textContent = 'Укажите полный адрес, начиная с https://'; return; }
    const btn = event.currentTarget.querySelector('button'); btn.disabled = true; status.textContent = 'Ищем ленту на сайте…';
    try {
      const data = await load([url.href]);
      if (!data.sources.length) throw Error(data.errors?.[0]?.message || 'Лента не найдена');
      const source = data.sources[0];
      if (sources.some(x => x.url === source.url)) throw Error('Этот источник уже добавлен');
      sources.push({title:source.title, url:source.url, enabled:true});
      if (persist()) status.textContent = 'Источник добавлен';
      input.value = ''; renderSources();
    } catch (error) { status.textContent = error.message; } finally { btn.disabled = false; }
  });
  refresh.addEventListener('click', async () => {
    const urls = sources.filter(x => x.enabled !== false).map(x => x.url);
    if (!urls.length) { status.textContent = 'Выберите хотя бы один источник'; return; }
    refresh.disabled = true; status.textContent = 'Собираем публикации…';
    try {
      const data = await load(urls);
      if (!data.sources.length) throw Error(data.errors?.[0]?.message || 'Источники недоступны');
      window.dispatchEvent(new CustomEvent('multitool:rss-results', {detail:data}));
      status.textContent = data.errors.length ? `Не удалось загрузить источников: ${data.errors.length}. ${data.errors.map(x => x.message).join('; ')}` : 'Лента обновлена';
    } catch (error) { status.textContent = error.message; } finally { refresh.disabled = false; }
  });
  renderSources();
})();
