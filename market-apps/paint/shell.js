/* На телефоне меню открывается по кнопке и закрывается клавишей Escape. */
(() => {
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#paint-site-nav');
  button.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    button.setAttribute('aria-expanded', String(!nav.hidden));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !nav.hidden) {
      nav.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    }
  });
})();
