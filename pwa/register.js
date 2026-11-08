(() => {
  'use strict';
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
    button.textContent = label;
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
    controls.replaceChildren();
    const showInstall = !installed() && 'serviceWorker' in navigator && window.isSecureContext;
    const waiting = registration && registration.waiting && navigator.serviceWorker.controller;
    if (showInstall) controls.append(makeButton('Установить приложение', install));
    // Отдельная ссылка позволяет загрузить тестовый APK и с компьютера.
    const apk = document.createElement('a');
    apk.className = 'pwa-apk';
    apk.href = '/downloads/multitool-android-1.0.0.apk';
    apk.download = 'multitool-android-1.0.0.apk';
    apk.textContent = 'Android APK (тест)';
    controls.append(apk);
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
