/* Общий поиск по каталогу инструментов. */
(() => {
  'use strict';
  const bar = document.getElementById('pwa-controls');
  if (!bar || bar.querySelector('.global-search')) return;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/pwa/global-search.css?v=20261110-2'; document.head.append(css);
  const box = document.createElement('div'); box.className = 'global-search';
  box.innerHTML = '<div class="global-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg><input type="search" aria-label="Поиск по всем инструментам" aria-controls="global-search-results" aria-expanded="false" autocomplete="off" placeholder="Найти инструмент"></div><div class="global-search-popup" id="global-search-results" hidden><p class="global-search-status" role="status"></p><div class="global-search-list"></div><button type="button" class="global-search-more" hidden>Показать ещё</button></div>';
  bar.prepend(box);
  const input=box.querySelector('input'), popup=box.querySelector('.global-search-popup'), list=box.querySelector('.global-search-list'), status=box.querySelector('.global-search-status'), more=box.querySelector('.global-search-more');
  let items=null, visible=8, matches=[];
  const norm=s=>String(s || '').toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
  function close(){popup.hidden=true;input.setAttribute('aria-expanded','false');}
  function render(){
    const query=norm(input.value); list.replaceChildren();
    if(!query){close();return;}
    popup.hidden=false; input.setAttribute('aria-expanded','true');
    if(!items){status.textContent='Загружаем каталог…';return;}
    const terms=query.split(/\s+/);
    matches=items.filter(i=>terms.every(term=>norm(i.title+' '+i.description+' '+(i.keywords||'')).includes(term))).sort((a,b)=>Number(norm(b.title).includes(query))-Number(norm(a.title).includes(query)));
    status.textContent=matches.length ? 'Найдено: '+matches.length : 'Ничего не найдено. Попробуйте другое название.';
    matches.slice(0,visible).forEach(item=>{
      const a=document.createElement('a'); a.href=item.url; if (item.external) { a.target='_blank'; a.rel='noopener noreferrer'; } const title=document.createElement('strong'); title.textContent=item.title;
      const description=document.createElement('span'); description.textContent=item.description; a.append(title,description); list.append(a);
    });
    more.hidden=visible>=matches.length; more.textContent='Показать ещё · '+(matches.length-visible);
  }
  input.addEventListener('input',()=>{visible=8;render();}); input.addEventListener('focus',render);
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){close();input.blur();} else if(e.key==='Enter' && matches.length && !popup.hidden){e.preventDefault();list.querySelector('a')?.click();}});
  more.addEventListener('click',()=>{visible+=8;render();});
  document.addEventListener('click',e=>{if(!box.contains(e.target))close();});
  // Внешние ресурсы показываем отдельно и ясно обозначаем переход на чужой сайт.
  let resources=[];
  function renderResources() {
    const grid=document.querySelector('#catalogs .catalog-grid');
    if(grid) resources.filter(item=>item.category==='catalog').forEach(item=>{
      const a=document.createElement('a'); a.className='catalog-card'; a.href=item.url; if (item.url.startsWith('https://')) { a.target='_blank'; a.rel='noopener noreferrer'; }
      const label=document.createElement('span'); label.className='catalog-label'; label.textContent=item.label;
      const title=document.createElement('h2'); title.textContent=item.title;
      const description=document.createElement('p'); description.textContent=item.description;
      const action=document.createElement('span'); action.className='catalog-action'; action.textContent=item.url.startsWith('https://')?'Открыть внешний сайт ↗':'Открыть каталог ↗';
      a.append(label,title,description,action); grid.append(a);
    });
    const share=document.querySelector('#notes .share-image-link');
    const transfer=resources.find(item=>item.category==='notes');
    if(share && transfer){const link=document.createElement('a');link.href=transfer.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Передать файл через DashBeam ↗';share.append(' ',link);}
  }
  Promise.all([
    fetch('/directions/catalog.json').then(r=>{if(!r.ok)throw new Error();return r.json();}),
    fetch('/games/catalog.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).catch(()=>[]),
    fetch('/pwa/external-resources.json').then(r=>{if(!r.ok)throw new Error();return r.json();}).catch(()=>[])
  ]).then(([data,games,external])=>{
    data=[...data,...games];
    if(!Array.isArray(data))throw new Error();
    resources=Array.isArray(external)?external.filter(i=>i && typeof i.title==='string' && typeof i.url==='string' && (/^(?:https:\/\/|\/(?!\/))/.test(i.url))):[];
    items=[...data.filter(i=>i && typeof i.title==='string' && typeof i.url==='string' && i.url.startsWith('/') && !i.url.startsWith('//')),...resources.map(i=>({...i,external:i.url.startsWith('https://')}))];
    renderResources();render();
  }).catch(()=>{items=[];if(norm(input.value)){popup.hidden=false;status.textContent='Каталог недоступен. Проверьте подключение.';}});
})();
