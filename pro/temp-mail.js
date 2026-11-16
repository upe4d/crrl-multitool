/* Приложение автора загружается только по явному запуску; наши страницы не читают письма из iframe. */
(() => {
 'use strict';
 const button=document.getElementById('tempmail-launch'),container=document.getElementById('tempmail-frame'),status=document.getElementById('tempmail-status');
 button.addEventListener('click',()=>{
  if(container.querySelector('iframe')){container.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});return;}
  const frame=document.createElement('iframe');frame.title='Официальный TempMail — временная почта';frame.src='https://mehmetkahya0.github.io/temp-mail/';frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
  frame.allow='clipboard-write';
  frame.addEventListener('load',()=>{status.textContent='Открыта официальная версия TempMail. Если приложение не показалось, воспользуйтесь ссылкой «Открыть официальную версию отдельно».';});
  container.hidden=false;container.append(frame);button.textContent='Перейти к почте';status.textContent='Загружаем официальный TempMail…';
 });
})();
