(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const language = params.get('lang') === 'ua' ? 'ua' : 'ru';
  const ukrainian = language === 'ua';
  const status = document.getElementById('player-status');
  const frame = document.getElementById('lesson-frame');
  const back = document.getElementById('player-back');
  const original = document.getElementById('open-original');
  const fullscreen = document.getElementById('player-fullscreen');
  const fullLabel = ukrainian ? 'На весь екран' : 'На весь экран';
  document.documentElement.lang = ukrainian ? 'uk' : 'ru';
  back.querySelector('span').textContent = ukrainian ? 'До занять' : 'К занятиям';
  back.href = `./${language}/`;
  fullscreen.setAttribute('aria-label', fullLabel);
  fullscreen.querySelector('span').textContent = fullLabel;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.getElementById('player-stage').requestFullscreen();
    } catch (_) { original.focus(); }
  });
  async function open() {
    try {
      const response = await fetch('./catalog-data.json?v=20261116-2');
      if (!response.ok) throw new Error('catalog');
      const catalog = await response.json();
      // Адрес строится только из белого списка установленных занятий.
      const game = catalog[language].find(item => item.slug === params.get('game'));
      if (!game) throw new Error('game');
      const url = `./${language}/${encodeURIComponent(game.slug)}/`;
      document.getElementById('lesson-title').textContent = game.title;
      document.title = `${game.title} — Мультитул`;
      back.href += `#${game.category}`;
      original.href = url;
      original.textContent = ukrainian ? 'Відкрити окремо ↗' : 'Открыть отдельно ↗';
      original.hidden = false;
      frame.title = game.title;
      frame.addEventListener('load', () => {
        status.hidden = true;
        // Внутренняя ссылка «Все уроки» возвращает каталог во всё окно.
        try {
          const page = frame.contentDocument;
          const isCatalog = url => url.origin === location.origin && /^\/market-apps\/school\/app\/(?:ru\/|ua\/)?(?:index\.html)?$/.test(url.pathname);
          const current = new URL(frame.contentWindow.location.href);
          if (isCatalog(current)) { location.assign(current.href); return; }
          page.querySelectorAll('a[href]').forEach(link => {
            if (isCatalog(new URL(link.href))) link.target = '_top';
          });
        } catch (_) { /* Внешние документы не участвуют в навигации каталога. */ }
      });
      frame.hidden = false;
      frame.src = url;
    } catch (_) {
      status.querySelector('h2').textContent = ukrainian ? 'Не вдалося відкрити заняття' : 'Не удалось открыть занятие';
      status.querySelector('p').textContent = ukrainian ? 'Поверніться до каталогу й оберіть гру ще раз.' : 'Вернитесь к каталогу и выберите игру ещё раз.';
      fullscreen.hidden = true;
    }
  }
  open();
})();
