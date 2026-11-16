/* Путь запуска берётся только из доверенного каталога, а не из параметра iframe. */
(() => {
  'use strict';const $=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id');let game,frame;
  // Справка использует только текстовые узлы, поэтому названия и инструкции не исполняются как HTML.
  function showGuide(guide){
    const box=$('guide-details');box.replaceChildren();
    function section(title,value,list=false){if(!value||(Array.isArray(value)&&!value.length))return;const area=document.createElement('section'),h=document.createElement('h3');h.textContent=title;area.append(h);if(list){const ol=document.createElement('ol');for(const line of value){const li=document.createElement('li');li.textContent=line;ol.append(li);}area.append(ol);}else{const p=document.createElement('p');p.textContent=value;area.append(p);}box.append(area);}
    section('С чего начать',guide.start,true);section('Результат и прохождение',guide.success);section('Что поможет',guide.advice);section('Особенности',guide.notes);
    $('controls').textContent=guide.controls||game.controls;
  }
  function launch(){if(frame)frame.remove();frame=document.createElement('iframe');frame.title=game.title;frame.allow='fullscreen; autoplay';frame.setAttribute('allowfullscreen','');frame.setAttribute('referrerpolicy','same-origin');const src=new URL($('language').value==='original'?game.originalPath:game.path,location.origin);frame.src=src.href;$('state').hidden=false;frame.onload=()=>{$('state').hidden=true;frame.focus();};$('scene').append(frame);}
  $('language').onchange=launch;$('help').onclick=()=>$('help-dialog').showModal();$('help-dialog').querySelector('.close').onclick=()=>$('help-dialog').close();$('help-dialog').onclick=e=>{if(e.target===$('help-dialog'))e.target.close();};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('scene').requestFullscreen();}catch(_){$('fullscreen').textContent='Режим недоступен';}};
  Promise.all([fetch('./catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}),fetch('./guides.ru.json?v=20261116-14').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({}))]).then(([items,guides])=>{
    game=items.find(x=>x.id===id);if(!game)throw Error('Игра не найдена');document.title=game.title+' · Мультитул';$('game-title').textContent=game.title;$('help-title').textContent=game.title;$('description').textContent=game.description;$('controls').textContent=game.controls;$('translation-note').textContent=game.translationNote||'';$('language').hidden=['shell','ru-only'].includes(game.languageMode);$('play-favorite').dataset.favUrl=game.url;
    const a=document.createElement('a');a.href=game.source;a.textContent='Авторские исходники ↗';a.target='_blank';a.rel='noopener noreferrer';$('source').append(a);document.dispatchEvent(new Event('multitool:favorites-render'));
    showGuide(guides[game.id]||{});
    launch();
  }).catch(e=>{$('game-title').textContent='Не удалось открыть игру';$('state').textContent=e.message||'Обновите страницу';$('language').disabled=true;});
})();
