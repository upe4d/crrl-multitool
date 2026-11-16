/* Поиск источников и отдельный вход из карточки Threads. */
(() => {
 'use strict';
 const input=document.getElementById('source-filter'),items=[...document.querySelectorAll('[data-source-name]')];
 input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();let visible=0;for(const item of items){item.hidden=!item.dataset.sourceName.includes(q);if(!item.hidden)visible++;}document.getElementById('source-empty').hidden=visible>0;});
 if(new URLSearchParams(location.search).get('source')==='threads'){
  document.getElementById('page-title').textContent='Видео из Threads';document.getElementById('url-hint').textContent='Вставьте полную ссылку на публичную публикацию Threads с видео. Для других сайтов тоже можно использовать эту форму.';
  document.getElementById('urls').placeholder='https://www.threads.com/@имя/post/КОД';
  document.querySelector('.reclip-favorite').dataset.favUrl='/reclip/?source=threads';
  document.dispatchEvent(new Event('multitool:favorites-render'));
 }
})();
