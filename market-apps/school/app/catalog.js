(() => {
  'use strict';
  const input = document.getElementById('lesson-search');
  if (!input) return;
  const ukrainian = document.body.dataset.language === 'ua';
  const sections = [...document.querySelectorAll('.subject')];
  const links = [...document.querySelectorAll('.category-link')];
  const cards = [...document.querySelectorAll('.lesson-card')];
  const controls = document.querySelector('.catalog-controls');
  const status = document.getElementById('search-status');
  const clear = document.getElementById('clear-search');
  const empty = document.getElementById('empty-state');
  const normalize = value => value.toLocaleLowerCase().normalize('NFKC').replace(/ё/g, 'е').trim();
  const searchable = new Map(cards.map(card => [card, normalize(card.dataset.search)]));

  function filter() {
    const words = normalize(input.value).split(/\s+/).filter(Boolean);
    let total = 0;
    sections.forEach((section, index) => {
      let count = 0;
      section.querySelectorAll('.lesson-card').forEach(card => {
        card.hidden = !words.every(word => searchable.get(card).includes(word));
        if (!card.hidden) count++;
      });
      total += count;
      section.hidden = count === 0;
      const badge = links[index].querySelector('.category-count');
      badge.textContent = words.length ? `${count}/${badge.dataset.total}` : badge.dataset.total;
      section.querySelector('.section-count').textContent = count;
      if (count) links[index].removeAttribute('aria-disabled');
      else links[index].setAttribute('aria-disabled', 'true');
    });
    clear.hidden = words.length === 0;
    empty.hidden = total !== 0;
    status.textContent = words.length ? `${ukrainian ? 'Знайдено' : 'Найдено'}: ${total} / ${cards.length}` : '';
    updateActive();
  }

  // Высота закреплённой панели учитывается и при переносе категорий на телефоне.
  function measureControls() {
    document.documentElement.style.setProperty('--catalog-offset', `${Math.ceil(controls.getBoundingClientRect().height) + 18}px`);
  }
  function updateActive() {
    const visible = sections.filter(section => !section.hidden);
    const edge = controls.getBoundingClientRect().bottom + 45;
    let active = visible[0];
    visible.forEach(section => { if (section.getBoundingClientRect().top <= edge) active = section; });
    links.forEach(link => {
      if (active && link.dataset.category === active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  input.addEventListener('input', filter);
  function reset() { input.value = ''; filter(); input.focus({ preventScroll: true }); }
  clear.addEventListener('click', reset);
  document.getElementById('reset-search').addEventListener('click', reset);
  links.forEach(link => link.addEventListener('click', event => {
    if (link.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
    // Фокус переносится на заголовок, чтобы переход работал и с клавиатуры.
    const section = document.getElementById(link.dataset.category);
    const heading = section.querySelector('h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }));
  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; updateActive(); });
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measureControls).observe(controls);
  else addEventListener('resize', measureControls);
  addEventListener('pageshow', filter);
  measureControls(); filter();
  // Обновляем прежний автономный каталог; сами занятия сохраняют свои ресурсы.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/market-apps/school/app/sw.js').catch(() => {});
  }
})();
