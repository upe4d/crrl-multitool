/* Тематические подразделы собираются из существующих карточек каталога. */
(() => {
  'use strict';
  const section = document.getElementById('catalogs');
  const grid = section?.querySelector('.catalog-grid');
  if (!grid) return;

  const categories = [
    ['all', 'Все'],
    ['interface', 'UI и формы'],
    ['graphics', 'Графика и 3D'],
    ['design', 'Дизайн и эффекты'],
    ['code', 'Код и справочники'],
  ];
  const nav = document.createElement('nav');
  nav.className = 'catalog-sections';
  nav.setAttribute('aria-label', 'Темы дизайна и разработки');
  const buttons = new Map();
  let selected = 'all';

  function category(card) {
    if (card.dataset.subsection) return card.dataset.subsection;
    const href = card.getAttribute('href') || '';
    if (/ui-components|tancn/i.test(href)) return 'interface';
    if (/icons\.html|objects\.html/i.test(href)) return 'graphics';
    if (/website-designs|art\.gptru|pixelfx/i.test(href)) return 'design';
    return 'code';
  }

  function render() {
    const cards = [...grid.querySelectorAll('.catalog-card')];
    const counts = Object.fromEntries(categories.map(([key]) => [key, 0]));
    counts.all = cards.length;
    cards.forEach(card => {
      const key = category(card);
      if (key in counts && key !== 'all') counts[key]++;
      card.hidden = selected !== 'all' && selected !== key;
    });
    categories.forEach(([key, title]) => {
      const button = buttons.get(key);
      button.setAttribute('aria-pressed', String(key === selected));
      button.querySelector('span').textContent = String(counts[key]);
      button.setAttribute('aria-label', `${title}: ${counts[key]}`);
    });
  }

  categories.forEach(([key, title]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.append(document.createTextNode(title + ' '), document.createElement('span'));
    button.addEventListener('click', () => { selected = key; render(); });
    buttons.set(key, button);
    nav.append(button);
  });
  grid.before(nav);
  render();
  // Новые карточки могут приходить после загрузки общей навигации.
  new MutationObserver(render).observe(grid, { childList: true });
})();
