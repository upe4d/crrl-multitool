/* Один список источников и поиск по популярным и всем поддерживаемым площадкам. */
(() => {
 'use strict';
 const input=document.getElementById('source-filter'),container=document.getElementById('all-sources');let items=[...document.querySelectorAll('[data-source-name]')];
 function filter(){const q=input.value.trim().toLowerCase();let visible=0;for(const item of items){item.hidden=!item.dataset.sourceName.includes(q);if(!item.hidden)visible++;}document.getElementById('source-empty').hidden=visible>0;}
 input.addEventListener('input',filter);
 fetch('./static/supported-sources.json?v=20261116-17').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  const names=[...data.entries,...(data.additionalVerified||[])];const fragment=document.createDocumentFragment();
  for(const name of names){const row=document.createElement('span');row.setAttribute('role','listitem');row.dataset.sourceName=name.toLowerCase();row.textContent=name.replace('(CURRENTLY BROKEN)','(Временно не работает)');if(name.includes('CURRENTLY BROKEN'))row.className='source-unavailable';fragment.append(row);}
  container.replaceChildren(fragment);items=[...document.querySelectorAll('[data-source-name]')];document.getElementById('source-total').textContent='· '+names.length+' записей';document.getElementById('source-version').textContent='yt-dlp '+data.version+' · Список проверен '+data.checkedAt+'. Внешние сервисы могут менять доступность отдельных роликов.';filter();
 }).catch(()=>{document.getElementById('source-version').textContent='Не удалось загрузить полный список. Обновите страницу или откройте официальный список по ссылке ниже.';});
})();
