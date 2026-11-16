/* Направления и инструменты в двух режимах навигации. */
(() => {
  "use strict";
  const groups = [
    ["files","Файлы","PDF, архивы и конвертеры","▧","#c0db8b"],
    ["text","Текст","Редактирование и заметки","¶","#b7c5f0"],
    ["images","Изображения","Фото, графика и обработка","◇","#d2b7f3"],
    ["audio","Аудио","Звук, запись и речь","♫","#92d4cf"],
    ["video","Видео","Монтаж, конвертация и загрузка","▷","#e5b5a0"],
    ["calc","Расчёты","Формулы и калькуляторы","∑","#d5c890"],
    ["design","Дизайн","Иконки, 3D и референсы","✳","#bda7e9"],
    ["ai","ИИ","Модели и инструменты","✦","#e4aecb"],
    ["dev","Разработка","Код, данные и DNS","⌘","#8cbfdf"],
    ["games","Игры","Проекты и эффекты","✣","#ddae8d"],
    ["work","Работа","Поиск и повседневные задачи","⌁","#a9c5a0"]
  ];
  const root = document.querySelector("#convert");
  if (!root) return;
  const hub = document.createElement("section");
  hub.id = "direction-hub";
  hub.className = "direction-hub";
  hub.innerHTML = '<div class="direction-heading"><div><span class="direction-kicker">МУЛЬТИТУЛ / КАТАЛОГ</span><h1>Инструменты для ваших задач</h1><p>Выберите направление и откройте нужный инструмент</p></div><div class="direction-controls" role="group" aria-label="Вид каталога"><button type="button" data-view="wheel" aria-pressed="true">Обзор</button><button type="button" data-view="list" aria-pressed="false">Список</button></div></div><div class="direction-stage"><div class="direction-overview"><div class="direction-showcase"><div class="direction-showcase-top"><span>НАПРАВЛЕНИЯ</span><span>ЛИСТАЙТЕ И ВЫБИРАЙТЕ</span></div><div class="direction-rack" aria-label="Выбор направления"></div><div class="direction-rack-controls"><button type="button" class="rack-prev" aria-label="Предыдущее направление">←</button><span class="rack-position" aria-live="polite"></span><button type="button" class="rack-next" aria-label="Следующее направление">→</button></div></div><div class="direction-classic" hidden><div class="classic-head"><h2>Все направления</h2><p>Выберите раздел, чтобы увидеть инструменты</p></div><div class="classic-items"></div></div></div><div class="direction-detail" hidden><div class="direction-detail-head"><div><button type="button" class="direction-back">← Все направления</button><h2></h2><p></p></div><label>Поиск в разделе<input type="search" placeholder="Название или задача"></label></div><div class="direction-grid"></div><p class="direction-empty" hidden>Ничего не найдено. Попробуйте другой запрос.</p><div class="direction-pagination"><button type="button" data-pager="prev">← Назад</button><span></span><button type="button" data-pager="next">Вперёд →</button></div></div></div>';
  root.prepend(hub);
  root.classList.add("hub-active");
  // Статистика отражает переходы из этого каталога, а не все посещения сайта.
  const popular = document.createElement('section');
  popular.className = 'direction-popular';
  popular.innerHTML = '<div class="popular-heading"><div><span class="direction-kicker">ВЫБОР ПОСЕТИТЕЛЕЙ</span><h2>Популярные инструменты</h2><p>Топ по переходам из каталога</p></div><span class="popular-count">ТОП / 10</span></div><div class="popular-list"></div><p class="popular-status">Загружаем статистику…</p>';
  hub.append(popular);
  const track = url => {
    const body = JSON.stringify({url});
    if (navigator.sendBeacon && navigator.sendBeacon('/directions/stats.php', new Blob([body], {type:'application/json'}))) return;
    fetch('/directions/stats.php', {method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true}).catch(() => {});
  };
  function renderPopular(counts) {
    const list = popular.querySelector('.popular-list');
    const status = popular.querySelector('.popular-status');
    list.replaceChildren();
    const byUrl = new Map(items.map(item => [item.url, item]));
    const ranked = Object.entries(counts || {}).filter(([url, count]) => byUrl.has(url) && Number(count) > 0).slice(0, 10);
    status.hidden = ranked.length > 0;
    if (!ranked.length) { status.textContent = 'Здесь появятся инструменты, которые чаще открывают из каталога'; return; }
    ranked.forEach(([url, count], i) => {
      const item = byUrl.get(url);
      const link = document.createElement('a'); link.href = url;
      const rank = document.createElement('span'); rank.className = 'popular-rank'; rank.textContent = String(i + 1).padStart(2, '0');
      const title = document.createElement('strong'); title.textContent = item.title;
      const uses = document.createElement('span'); uses.className = 'popular-uses'; uses.textContent = Number(count).toLocaleString('ru-RU') + ' ↗';
      link.append(rank, title, uses); list.append(link);
    });
  }
  popular.addEventListener('click', event => { const link = event.target.closest('a'); if (link) track(link.getAttribute('href')); });
  const overview = hub.querySelector(".direction-overview");
  const detail = hub.querySelector(".direction-detail");
  const rack = hub.querySelector(".direction-rack");
  const classic = hub.querySelector(".direction-classic");
  const showcase = hub.querySelector('.direction-showcase');
  // Отдельные слои сцены создают глубину и не перехватывают нажатия.
  const atmosphere = document.createElement('div');
  atmosphere.className = 'rack-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  atmosphere.innerHTML = '<div class="rack-horizon"></div><div class="rack-orbit rack-orbit-one"></div><div class="rack-orbit rack-orbit-two"></div><div class="rack-orbit rack-orbit-three"></div><div class="rack-beam"></div><div class="rack-watermark"></div><svg class="rack-trajectories" viewBox="0 0 1200 380" preserveAspectRatio="none" aria-hidden="true"><path d="M-30 305 C180 220 265 300 475 195 S860 50 1230 105"></path><path d="M-30 120 C210 20 300 150 520 220 S970 360 1230 205"></path><path d="M-30 260 C250 340 320 165 555 135 S965 60 1230 155"></path></svg>';
  showcase.prepend(atmosphere);
  const autoButton = document.createElement('button');
  autoButton.type = 'button';
  autoButton.className = 'rack-auto';
  showcase.querySelector('.direction-rack-controls').append(autoButton);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let autoEnabled = !reducedMotion.matches;
  function updateAutoButton() {
    autoButton.setAttribute('aria-pressed', String(autoEnabled));
    autoButton.textContent = autoEnabled ? 'Пауза' : 'Продолжить';
    autoButton.setAttribute('aria-label', autoEnabled ? 'Остановить движение и перелистывание' : 'Включить движение и перелистывание');
    hub.querySelector('.rack-position').setAttribute('aria-live', autoEnabled ? 'off' : 'polite');
    showcase.classList.toggle('motion-paused', !autoEnabled);
  }
  function pauseAuto() { if (autoEnabled) { autoEnabled = false; updateAutoButton(); } }
  autoButton.addEventListener('click', () => { autoEnabled = !autoEnabled; if (autoEnabled) lastInteraction = performance.now(); updateAutoButton(); });
  updateAutoButton();
  let items = [], current = "", page = 1, selected = 0;
  const size = 12;
  const query = detail.querySelector("input");
  function choose(id) {
    const group = groups.find(x => x[0] === id);
    current = id; page = 1; query.value = "";
    detail.style.setProperty('--section-accent', group[4]);
    detail.querySelector("h2").textContent = group[1];
    detail.querySelector(".direction-detail-head p").textContent = group[2];
    overview.classList.add("is-leaving");
    window.setTimeout(() => { overview.hidden = true; overview.classList.remove("is-leaving"); detail.hidden = false; render(); }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
  }
  // Значки направлений взяты из локальной библиотеки Reicon.
  function makeIcon(id) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true');
    const use=document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttribute('href','/directions/icons.svg#'+id); svg.append(use); return svg;
  }
  const cards = groups.map((group, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "rack-card";
    button.style.setProperty("--accent",group[4]);
    button.innerHTML = '<span class="rack-index"></span><span class="rack-symbol" aria-hidden="true"></span><strong></strong><small></small><span class="rack-action">ОТКРЫТЬ ↗</span>';
    button.querySelector(".rack-index").textContent = String(index + 1).padStart(2,"0") + " / " + groups.length;
    button.querySelector(".rack-symbol").append(makeIcon(group[0]));
    button.querySelector("strong").textContent = group[1];
    button.querySelector("small").textContent = group[2];
    button.addEventListener("click", () => choose(group[0]));
    rack.append(button);
    const row = document.createElement("button");
    row.type = "button"; row.className = "classic-row"; row.style.setProperty("--accent",group[4]);
    const icon = document.createElement("span"); icon.className="classic-symbol"; icon.append(makeIcon(group[0])); icon.setAttribute("aria-hidden","true");
    const text = document.createElement("span"); const strong = document.createElement("strong"); strong.textContent=group[1]; const small=document.createElement("small"); small.textContent=group[2]; text.append(strong,small);
    const arrow=document.createElement("span"); arrow.textContent="↗"; arrow.className="classic-arrow"; row.append(icon,text,arrow);
    row.addEventListener("click", () => choose(group[0])); hub.querySelector(".classic-items").append(row);
    return button;
  });
  function showRack() {
    cards.forEach((card,index) => {
      let offset = (index - selected + groups.length) % groups.length;
      if (offset > Math.floor(groups.length/2)) offset -= groups.length;
      const visible = Math.abs(offset) <= (matchMedia('(max-width:520px)').matches ? 0 : 2);
      card.style.setProperty("--shift", offset);
      card.style.setProperty("--depth", Math.max(.58,1-Math.abs(offset)*.13));
      card.style.setProperty("--turn", (-offset*12)+"deg");
      card.style.zIndex = String(10-Math.abs(offset));
      card.classList.toggle("rack-offscreen",!visible);
      card.setAttribute("aria-hidden",String(!visible));
      card.tabIndex=visible?0:-1;
      card.classList.toggle("rack-current",offset===0);
    });
    hub.querySelector(".rack-position").textContent = String(selected+1).padStart(2,"0")+" / "+String(groups.length).padStart(2,"0");
    showcase.style.setProperty('--scene-accent', groups[selected][4]);
    atmosphere.querySelector('.rack-watermark').textContent = groups[selected][1];
  }
  showRack();
  matchMedia('(max-width:520px)').addEventListener('change', showRack);
  // После ручного выбора даём время рассмотреть карточку и сохраняем выбранный режим.
  let lastInteraction = performance.now();
  const deferAuto = () => { lastInteraction = performance.now(); };
  hub.querySelector(".rack-prev").addEventListener("click", () => {deferAuto(); selected=(selected+groups.length-1)%groups.length; showRack()});
  hub.querySelector(".rack-next").addEventListener("click", () => {deferAuto(); selected=(selected+1)%groups.length; showRack()});
  // При работе с клавиатурой движение ждёт, пока фокус не покинет карусель.
  window.setInterval(() => {
    const rect = showcase.getBoundingClientRect();
    if (!autoEnabled || performance.now() - lastInteraction < 5500 || document.hidden || overview.hidden || showcase.hidden || !root.classList.contains('hub-active') || rect.bottom < 0 || rect.top > innerHeight || (showcase.contains(document.activeElement) && document.activeElement !== autoButton && document.activeElement.matches(':focus-visible'))) return;
    selected = (selected + 1) % groups.length;
    deferAuto(); showRack();
  }, 500);
  reducedMotion.addEventListener('change', event => { if (event.matches) pauseAuto(); });
  // Свайп перелистывает стеллаж, вертикальный жест остаётся прокруткой страницы.
  let startX = 0, startY = 0, pointer = null, suppressClick = false;
  rack.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    deferAuto();
    pointer = event.pointerId; startX = event.clientX; startY = event.clientY;
  });
  rack.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    const dx = event.clientX - startX, dy = event.clientY - startY;
    if (Math.abs(dx) < 35 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
    deferAuto();
    selected = (selected + (dx < 0 ? 1 : groups.length - 1)) % groups.length;
    showRack(); suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 350);
  });
  rack.addEventListener('pointercancel', () => { pointer = null; });
  rack.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
  // Небольшой параллакс работает только для устройств с указателем.
  showcase.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = showcase.getBoundingClientRect();
    showcase.style.setProperty('--pointer-x', ((event.clientX - bounds.left) / bounds.width - .5).toFixed(3));
    showcase.style.setProperty('--pointer-y', ((event.clientY - bounds.top) / bounds.height - .5).toFixed(3));
  });
  showcase.addEventListener('pointerleave', () => { showcase.style.setProperty('--pointer-x', 0); showcase.style.setProperty('--pointer-y', 0); });
  function render() {
    const needle = query.value.trim().toLocaleLowerCase("ru");
    const filtered = items.filter(x => (x.groups || [x.group]).includes(current) && (x.title + " " + x.description).toLocaleLowerCase("ru").includes(needle));
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(page, pages);
    const grid = detail.querySelector(".direction-grid"); grid.replaceChildren();
    filtered.slice((page - 1) * size, page * size).forEach(item => {
      const a = document.createElement("a"); a.href = item.url;
      if (item.external) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      const title = document.createElement("strong"); title.textContent = item.title;
      const desc = document.createElement("span"); desc.textContent = item.description;
      const arrow = document.createElement("b"); arrow.textContent = "↗"; arrow.setAttribute("aria-hidden", "true");
      a.append(title, arrow, desc);
      const card = document.createElement('article'); card.className = 'direction-tool';
      const favorite = document.createElement('button'); favorite.type = 'button'; favorite.className = 'favorite-toggle'; favorite.dataset.favUrl = item.url;
      favorite.setAttribute('aria-label', 'Добавить в избранное: ' + item.title); favorite.textContent = '☆';
      card.append(a); if (!item.resource) card.append(favorite); grid.append(card);
    });
    document.dispatchEvent(new CustomEvent('multitool:favorites-render'));
    detail.querySelector(".direction-empty").hidden = filtered.length !== 0;
    const pager = detail.querySelector(".direction-pagination");
    pager.hidden = pages === 1;
    pager.querySelector("span").textContent = page + " / " + pages;
    pager.querySelector('[data-pager="prev"]').disabled = page === 1;
    pager.querySelector('[data-pager="next"]').disabled = page === pages;
  }
  query.addEventListener("input", () => { page = 1; render(); });
  detail.querySelector('.direction-grid').addEventListener('click', event => { const link = event.target.closest('a'); if (link) track(link.getAttribute('href')); });
  detail.querySelector('[data-pager="prev"]').addEventListener("click", () => { page--; render(); });
  detail.querySelector('[data-pager="next"]').addEventListener("click", () => { page++; render(); });
  detail.querySelector(".direction-back").addEventListener("click", () => { detail.hidden = true; overview.hidden = false; });
  hub.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    const list = button.dataset.view === "list";
    classic.hidden = !list; hub.querySelector(".direction-showcase").hidden = list;
    hub.querySelectorAll("[data-view]").forEach(x => x.setAttribute("aria-pressed", String(x === button)));
    if (!detail.hidden) { detail.hidden=true; overview.hidden=false; }
  }));
  document.addEventListener("click", event => {
    if (event.target.closest("[data-side-tool],[data-side-converter]")) root.classList.remove("hub-active");
    if (event.target.closest('[data-page="convert"]')) root.classList.add("hub-active");
  });
  // Внешние сервисы дополняют направления, но не выдаются за локальные инструменты.
  Promise.all([
    fetch("/directions/catalog.json").then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch("/pwa/external-resources.json").then(r => { if (!r.ok) throw new Error(); return r.json(); }).catch(() => [])
  ]).then(([data, external]) => {
    items = data.concat(Array.isArray(external) ? external.filter(x => x && typeof x.title === "string" && typeof x.url === "string" && /^(?:https:\/\/|\/(?!\/))/.test(x.url) && Array.isArray(x.groups)).map(x => ({...x, resource: true, external: x.url.startsWith('https://')})) : []); if (current) render();
    return fetch('/directions/stats.php', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => renderPopular(data.counts)).catch(() => { popular.querySelector('.popular-status').textContent = 'Статистика временно недоступна'; });
  }).catch(() => {
    detail.querySelector(".direction-empty").textContent = "Каталог временно недоступен. Попробуйте обновить страницу.";
    detail.querySelector(".direction-empty").hidden = false;
  });
})();
