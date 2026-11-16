/* Избранное доступно локально; аккаунт синхронизирует его между устройствами. */
(() => {
  'use strict';
  if (window.multitoolFavoritesLoaded) return;
  window.multitoolFavoritesLoaded = true;
  const key = 'multitool-favorites-v1';
  let state;
  try { state = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { state = {}; }
  if (!state || typeof state !== 'object') state = {};
  for (const name of ['urls','add','remove']) if (!Array.isArray(state[name])) state[name] = [];
  const canonical=url=>url==='/reclip/?source=threads'?'/reclip/':url;
  for(const name of ['urls','add','remove'])state[name]=[...new Set(state[name].map(canonical))];
  let catalog = [], csrf = '', username = null, online = false, busy = false, showAll = false;
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/favorites/favorites.css?v=20261109-1'; document.head.append(link);
  function persist() { try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {} document.dispatchEvent(new Event('multitool:favorites-change')); }
  // Общий список доступен каталогам игр без отдельного хранилища.
  window.multitoolFavorites = Object.freeze({urls:()=>[...state.urls]});
  function title(url) { return catalog.find(item => item.url === url)?.title || 'Инструмент'; }
  function setMessage(message) { const el = document.querySelector('.favorite-message'); if (el) el.textContent = message; }
  function paintButtons() {
    document.querySelectorAll('[data-fav-url]').forEach(button => {
      if (button.classList.contains('favorite-remove')) return;
      const active = state.urls.includes(button.dataset.favUrl);
      button.textContent = button.classList.contains('favorite-page') ? (active ? '★ В избранном' : '☆ В избранное') : (active ? '★' : '☆');
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', (active ? 'Убрать из избранного: ' : 'Добавить в избранное: ') + title(button.dataset.favUrl));
    });
  }
  function draw() {
    paintButtons();
    const panel = document.querySelector('.favorites-panel');
    if (!panel) return;
    panel.querySelector('.favorites-account').textContent = username ? 'Аккаунт: ' + username : 'Войти / создать аккаунт';
    panel.querySelector('.favorites-mode').textContent = username ? (online ? (busy || state.add.length || state.remove.length ? 'Синхронизация…' : 'Синхронизировано с аккаунтом') : 'Локально, ожидает подключения') : 'Сохраняется в этом браузере';
    const list = panel.querySelector('.favorites-list'); list.replaceChildren();
    const valid = state.urls.filter(url => catalog.some(item => item.url === url));
    panel.querySelector('.favorites-empty').hidden = valid.length > 0;
    panel.querySelector('.favorites-count').textContent = String(valid.length);
    const more=panel.querySelector('.favorites-more'); more.hidden=valid.length<=6; more.textContent=showAll?'Свернуть':'Показать все · '+valid.length;
    (showAll ? valid : valid.slice(0,6)).forEach(url => {
      const item = document.createElement('div'); item.className = 'favorite-item';
      const a = document.createElement('a'); a.href = url; a.textContent = title(url);
      const remove = document.createElement('button'); remove.type='button'; remove.className='favorite-remove'; remove.dataset.favUrl=url; remove.setAttribute('aria-label','Убрать из избранного: '+title(url)); remove.textContent='×';
      item.append(a,remove); list.append(item);
    });
  }
  async function request(action, extra = {}) {
    const response = await fetch('/api/favorites/', {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action, csrf, ...extra})});
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Не удалось выполнить действие');
    csrf = data.csrf; return data;
  }
  async function flush() {
    if (!username || !online || busy || (!state.add.length && !state.remove.length)) return;
    busy = true;
    const add = [...state.add], remove = [...state.remove];
    try {
      const result = await request('change', {add, remove});
      state.add = state.add.filter(url => !add.includes(url)); state.remove = state.remove.filter(url => !remove.includes(url));
      state.urls = [...new Set([...result.favorites.map(canonical), ...state.add])].filter(url => !state.remove.includes(url));
      state.owner = username; persist();
    } catch (_) { online = false; }
    finally { busy = false; draw(); if (online && (state.add.length || state.remove.length)) flush(); }
  }
  function toggle(url) {
    if (!catalog.some(item => item.url === url)) return;
    const active = state.urls.includes(url);
    state.urls = active ? state.urls.filter(item => item !== url) : [...state.urls, url];
    if (username || state.owner) {
      state.add = state.add.filter(item => item !== url); state.remove = state.remove.filter(item => item !== url);
      (active ? state.remove : state.add).push(url);
    }
    persist(); draw(); flush();
  }
  async function adoptAccount(data) {
    username = data.username; online = true; csrf = data.csrf;
    if (username) {
      if (state.owner !== username) { state.add = [...new Set([...state.urls, ...state.add])]; state.remove = []; }
      state.urls = [...new Set([...(data.favorites || []).map(canonical), ...state.add])].filter(url => !state.remove.includes(url));
      state.owner = username;
    }
    persist(); draw(); await flush();
  }
  function mountDialog() {
    if (document.querySelector('#favorites-dialog')) return;
    const dialog = document.createElement('dialog'); dialog.id='favorites-dialog'; dialog.className='favorites-dialog';
    dialog.innerHTML = '<div class="favorites-dialog-head"><div><span class="favorites-eyebrow">ИЗБРАННОЕ НА РАЗНЫХ УСТРОЙСТВАХ</span><h2>Вход по логину</h2></div><button type="button" class="favorites-close" aria-label="Закрыть">×</button></div><p class="favorites-account-text">Введите логин для входа или создайте новый. Локальные закладки объединятся с сохранёнными.</p><form class="favorites-form"><label>Логин<input name="username" autocomplete="username" required minlength="3" maxlength="32" placeholder="Латинские буквы и цифры"></label><div class="favorites-actions"><button type="submit" value="login">Войти</button><button type="submit" value="register">Создать логин</button><button type="button" class="favorites-logout" hidden>Выйти</button></div></form><p class="favorites-recovery">Вход без пароля: любой, кто знает логин, сможет просматривать и менять эту подборку.</p><p class="favorite-message" role="status" aria-live="polite"></p>';
    document.body.append(dialog);
    dialog.querySelector('.favorites-close').onclick=()=>dialog.close();
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault(); setMessage('Подождите…');
      const form=event.currentTarget; const action=event.submitter?.value || 'login';
      try { const data=await request(action, {username:form.elements.namedItem('username').value}); await adoptAccount(data); setMessage('Готово'); dialog.close(); }
      catch(error) { setMessage(error.message || 'Ошибка подключения'); }
    });
    dialog.querySelector('.favorites-logout').addEventListener('click', async () => {
      try { const data=await request('logout'); state.owner=null; state.add=[]; state.remove=[]; await adoptAccount(data); dialog.close(); } catch(error) { setMessage(error.message); }
    });
  }
  function mount() {
    const hub = document.querySelector('#direction-hub');
    if (hub && !hub.querySelector('.favorites-panel')) {
      const panel=document.createElement('section'); panel.className='favorites-panel';
      panel.innerHTML='<div class="favorites-panel-head"><div><span class="favorites-eyebrow">БЫСТРЫЙ ДОСТУП</span><h2>Избранное <span class="favorites-count">0</span></h2><p class="favorites-mode"></p></div><button type="button" class="favorites-account">Войти / создать аккаунт</button></div><div class="favorites-list"></div><p class="favorites-empty">Нажмите ☆ на карточке инструмента, чтобы он всегда был под рукой</p><button type="button" class="favorites-more" hidden></button>';
      hub.querySelector('.direction-heading').after(panel);
      panel.querySelector('.favorites-more').onclick=()=>{ showAll=!showAll; draw(); };
      panel.querySelector('.favorites-account').onclick=async()=>{ if(!online) await refreshAccount(); mountDialog(); const dialog=document.querySelector('#favorites-dialog'); dialog.querySelector('.favorites-logout').hidden=!username; setMessage(online ? '' : 'Нет соединения с сервисом аккаунтов'); dialog.showModal(); };
    }
    const path=location.pathname;
    if (path.startsWith('/browsery/tools/') && catalog.some(item=>item.url===path) && !document.querySelector('.favorite-page')) {
      const button=document.createElement('button'); button.type='button'; button.className='favorite-page'; button.dataset.favUrl=path; document.body.append(button);
    }
    draw();
  }
  async function openAccount() { if(!online) await refreshAccount(); mountDialog(); const dialog=document.querySelector('#favorites-dialog'); dialog.querySelector('.favorites-logout').hidden=!username; setMessage(online ? '' : 'Нет соединения с сервисом аккаунтов'); dialog.showModal(); }
  document.addEventListener('click',event=>{if(event.target.closest('[data-favorites-account]'))openAccount();});
  document.addEventListener('click', event => { const b=event.target.closest('[data-fav-url]'); if (b) { event.preventDefault(); toggle(b.dataset.favUrl); } });
  document.addEventListener('multitool:favorites-render', draw);
  window.addEventListener('storage', event => { if (event.key===key) { try { const next=JSON.parse(event.newValue || '{}'); if(next && typeof next==='object' && ['urls','add','remove'].every(name=>Array.isArray(next[name]))) state=next; } catch (_) {} document.dispatchEvent(new Event('multitool:favorites-change')); draw(); } });
  async function refreshAccount() { try { const response=await fetch('/api/favorites/', {credentials:'same-origin',cache:'no-store'}); if(!response.ok) throw new Error(); await adoptAccount(await response.json()); } catch (_) { online=false; draw(); } }
  window.addEventListener('online', refreshAccount);
  Promise.all([
    fetch('/directions/catalog.json?v=20261116-19',{cache:'no-store'}).then(r=>{if(!r.ok) throw new Error(); return r.json();}),
    fetch('/games/catalog.json').then(r=>{if(!r.ok) throw new Error(); return r.json();}).catch(()=>[]),
    fetch('/api/favorites/', {credentials:'same-origin', cache:'no-store'}).then(r=>{if(!r.ok) throw new Error(); return r.json();}).catch(()=>null)
  ]).then(async ([items,games,account]) => { catalog=[...items,...games]; document.dispatchEvent(new Event('multitool:favorites-change'));  mount(); if (account) await adoptAccount(account); else { username=state.owner || null; online=false; draw(); } }).catch(()=>{});
})();
