/* Последние изменения хранятся в отдельном JSON, чтобы их было легко дополнять. */
(() => {
  'use strict';
  const controls = document.getElementById('pwa-controls');
  if (!controls || controls.querySelector('.updates-trigger')) return;

  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = '/pwa/updates.css?v=20261115-1';
  document.head.append(style);

  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.className = 'pwa-icon updates-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.innerHTML = '<span class="updates-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a7 7 0 0 1 7 7v4l2 3H3l2-3v-4a7 7 0 0 1 7-7zm-2 17h4"/></svg></span><span>Что нового</span>';
  controls.append(trigger);

  const dialog = document.createElement('dialog');
  dialog.className = 'updates-dialog';
  dialog.setAttribute('aria-labelledby', 'updates-title');
  dialog.innerHTML = '<div class="updates-head"><div><span class="updates-kicker">МУЛЬТИТУЛ / ЖУРНАЛ</span><h2 id="updates-title">Что нового</h2><p>Последние изменения и новые инструменты</p></div><button class="updates-close" type="button" aria-label="Закрыть">×</button></div><div class="updates-body" aria-live="polite"><p class="updates-state">Загружаем обновления…</p></div>';
  document.body.append(dialog);
  const body = dialog.querySelector('.updates-body');
  const storageKey = 'multitool-updates-seen';
  let entries = [];

  function seen() { try { return localStorage.getItem(storageKey) || ''; } catch (_) { return ''; } }
  function markSeen() {
    if (!entries.length) return;
    try { localStorage.setItem(storageKey, entries[0].id); } catch (_) {}
    trigger.classList.remove('has-unread');
  }
  function updateIndicator() { trigger.classList.toggle('has-unread', Boolean(entries.length && seen() !== entries[0].id)); }
  function render() {
    body.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('p'); empty.className = 'updates-state'; empty.textContent = 'Пока нет записей об обновлениях.'; body.append(empty); return;
    }
    let lastDate = '';
    entries.forEach(item => {
      if (lastDate !== item.date) {
        lastDate = item.date;
        const date = document.createElement('p'); date.className = 'updates-date';
        const parsed = new Date(item.date + 'T12:00:00');
        date.textContent = Number.isNaN(parsed.valueOf()) ? item.date : new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric'}).format(parsed);
        body.append(date);
      }
      const row = document.createElement('article'); row.className = 'updates-item';
      const content = document.createElement('div');
      const section = document.createElement('span'); section.className = 'updates-section'; section.textContent = item.section;
      const title = document.createElement('h3'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description;
      content.append(section, title, description);
      if (item.url && (/^\/(?!\/)/.test(item.url) || /^https:\/\//.test(item.url))) {
        const link = document.createElement('a'); link.href = item.url; link.textContent = 'Открыть ↗';
        if (item.url.startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        link.addEventListener('click', () => dialog.close()); content.append(link);
      }
      row.append(content); body.append(row);
    });
  }
  async function load() {
    try {
      const response = await fetch('/pwa/updates.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('updates unavailable');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('invalid updates');
      entries = data.filter(item => item && ['id','date','section','title','description'].every(key => typeof item[key] === 'string'));
      render(); updateIndicator();
      if (dialog.open) markSeen();
    } catch (_) {
      body.replaceChildren();
      const error = document.createElement('p'); error.className = 'updates-state'; error.textContent = 'Не удалось загрузить обновления. Попробуйте ещё раз.'; body.append(error);
    }
  }
  trigger.addEventListener('click', () => { dialog.showModal(); markSeen(); if (!entries.length) load(); });
  dialog.querySelector('.updates-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  load();
})();
