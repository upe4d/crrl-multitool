(() => {
  'use strict';
  // На страницах инструментов добавляем ту же кнопку избранного, что и в каталоге.
  if (location.pathname.startsWith('/browsery/tools/')) {
    const favorites = document.createElement('script');
    favorites.src = '/favorites/favorites.js?v=20261109-1';
    favorites.defer = true;
    document.head.append(favorites);
  }
  let installEvent = null;
  let registration = null;
  let updateRequested = false;
  let controls = null;

  // В установленном режиме повторно предлагать установку не нужно.
  const installed = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const listenForInstall = event => { event.preventDefault(); installEvent = event; render(); };
  window.addEventListener('beforeinstallprompt', listenForInstall);
  window.addEventListener('appinstalled', () => { installEvent = null; render(); });

  function makeButton(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pwa-icon';
    button.title = label; button.setAttribute('aria-label', label);
    button.innerHTML = label.startsWith('Обновить') ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5 9a8 8 0 0 1 14-2l1 5M19 15a8 8 0 0 1-14 2l-1-5"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 17v3h14v-3"/></svg>';
    const caption = document.createElement('span'); caption.textContent = label.startsWith('Обновить') ? 'Обновить' : 'Установить'; button.append(caption);
    button.addEventListener('click', action);
    return button;
  }

  async function install() {
    if (installEvent) {
      const prompt = installEvent;
      installEvent = null;
      try { await prompt.prompt(); await prompt.userChoice; } catch (_) {}
      render();
      return;
    }
    const guide = controls.querySelector('.pwa-guide');
    guide.hidden = !guide.hidden;
  }

  function render() {
    if (!controls) return;
    const search = controls.querySelector('.global-search');
    const updates = controls.querySelector('.updates-trigger');
    controls.replaceChildren();
    if (search) controls.append(search);
    if (updates) controls.append(updates);
    const showInstall = !installed() && 'serviceWorker' in navigator && window.isSecureContext;
    const waiting = registration && registration.waiting && navigator.serviceWorker.controller;
    if (showInstall) controls.append(makeButton('Установить приложение', install));
    // Отдельная ссылка позволяет загрузить тестовый APK и с компьютера.
    const apk = document.createElement('a');
    apk.className = 'pwa-apk pwa-icon';
    apk.href = '/downloads/multitool-android-1.0.1.apk';
    apk.download = 'multitool-android-1.0.1.apk';
    apk.title = 'Скачать Android APK (тест)'; apk.setAttribute('aria-label', apk.title);
    apk.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11a7 7 0 0 1 14 0v6H5zm2-8 2 3m8-3-2 3M8 17v3m8-3v3M3 11v5m18-5v5M9 10h.01M15 10h.01"/></svg>';
    const apkCaption = document.createElement('span'); apkCaption.textContent = 'Android APK'; apk.append(apkCaption);
    controls.append(apk);
    // Страница доступна в браузере и в установленном приложении.
    const about = document.createElement('a');
    about.className = 'pwa-apk pwa-icon';
    about.href = '/about/';
    about.title = 'О проекте'; about.setAttribute('aria-label', about.title);
    about.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>';
    const aboutCaption = document.createElement('span'); aboutCaption.textContent = 'О проекте'; about.append(aboutCaption);
    controls.append(about);
    // Фирменный знак GitHub ведёт прямо к исходникам этой версии Мультитула.
    const github = document.createElement('a');
    github.className = 'pwa-apk pwa-icon pwa-github';
    github.href = 'https://github.com/upe4d/crrl-multitool';
    github.target = '_blank'; github.rel = 'noopener noreferrer';
    github.title = 'Исходный код Мультитула на GitHub';
    github.setAttribute('aria-label', 'Мультитул на GitHub — откроется в новой вкладке');
    github.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 .297a12 12 0 0 0-3.793 23.385c.6.111.82-.258.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.071 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.303-5.466-1.333-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.52 11.52 0 0 1 6.004 0c2.291-1.553 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.769.84 1.235 1.911 1.235 3.221 0 4.61-2.805 5.624-5.475 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.216.694.825.576A12.001 12.001 0 0 0 12 .297Z"/></svg>';
    const githubCaption = document.createElement('span'); githubCaption.textContent = 'GitHub'; github.append(githubCaption);
    controls.append(github);
    if (waiting) controls.append(makeButton('Обновить приложение', () => {
      updateRequested = true;
      registration.waiting.postMessage({ type: 'MULTITOOL_ACTIVATE_UPDATE' });
    }));
    if (!navigator.onLine) {
      const status = document.createElement('span');
      status.className = 'pwa-status';
      status.setAttribute('role', 'status');
      status.textContent = 'Нет сети: некоторые ранее открытые страницы могут быть доступны';
      controls.append(status);
    }
    if (showInstall) {
      const guide = document.createElement('p');
      guide.className = 'pwa-guide';
      guide.hidden = true;
      const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      guide.textContent = isAppleMobile
        ? 'В Safari нажмите «Поделиться» → «На экран Домой». Доступность зависит от версии системы и браузера.'
        : 'Если браузер поддерживает установку, откройте его меню и выберите «Установить приложение» или «Добавить на главный экран». Для установки на сайте нужен HTTPS.';
      controls.append(guide);
    }
    controls.hidden = !controls.querySelector('button, .pwa-status, .pwa-apk');
  }

  async function setup() {
    // Каталог BrowseryTools имеет собственную шапку, поэтому добавляем общий переход после её загрузки.
    if (location.pathname.startsWith('/browsery/')) {
      if (!document.querySelector('link[data-multitool-brand]')) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = '/pwa/brand.css?v=20261108-1';
        style.dataset.multitoolBrand = '';
        document.head.append(style);
      }
      const nav = document.querySelector('nav[class*="main-navigation_links"]');
      const addCatalogLink = () => {
        if (!nav || nav.querySelector('a[href="/#catalogs"]')) return;
        const link = document.createElement('a');
        link.href = '/#catalogs';
        link.textContent = 'Дизайнеру и разработчику';
        // Длинное название остаётся читаемым в мобильной шапке.
        link.style.whiteSpace = 'normal';
        link.style.textAlign = 'center';
        link.style.lineHeight = '1.15';
        const next = nav.querySelector('a[href="/#notes"]');
        nav.insertBefore(link, next);
      };
      if (nav) {
        addCatalogLink();
        new MutationObserver(addCatalogLink).observe(nav, { childList: true });
      }
    }
    controls = document.getElementById('pwa-controls');
    if (!controls) return;
    render();
    const globalSearch = document.createElement('script');
    globalSearch.src = '/pwa/global-search.js?v=20261116-2';
    globalSearch.defer = true; document.head.append(globalSearch);
    // Журнал остаётся на панели и после обновления состояния PWA.
    const updates = document.createElement('script');
    updates.src = '/pwa/updates.js?v=20261115-1';
    updates.defer = true; document.head.append(updates);
    window.addEventListener('online', render);
    window.addEventListener('offline', render);
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', render);
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (updateRequested) window.location.reload();
      });
      render();
    } catch (error) {
      console.warn('Не удалось подключить автономную оболочку:', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
