/* Кампании используют разные пространства сохранений; игровой код и данные загружаются с нашего сайта. */
import {DoomEngine} from './src/engine/DoomEngine.js';
const $=id=>document.getElementById(id),phase=new URLSearchParams(location.search).get('phase')==='2'?2:1;
$('title').textContent='Freedoom: Phase '+phase;let engine,loading=false;
$('start').onclick=async()=>{
 if(loading)return;loading=true;$('start').disabled=true;$('status').textContent='Скачиваем игровые данные…';
 try{
  const response=await fetch('./freedoom'+phase+'.wad');if(!response.ok)throw Error('HTTP '+response.status);const wad=new Uint8Array(await response.arrayBuffer());
  engine=new DoomEngine({canvas:$('screen'),onFatalError:message=>{$('loading').hidden=false;$('status').textContent='Игра остановлена: '+message;}});
  await engine.load({wasmPath:'./doom.wasm',wad,saveProfile:'multitool:freedoom-phase-'+phase,onProgress:percent=>{$('status').textContent='Подготовка игры: '+percent+'%';}});
  $('loading').hidden=true;$('screen').focus();
 }catch(error){engine?.destroy();$('status').textContent='Не удалось запустить игру: '+error.message+'. Нажмите кнопку для повторной попытки.';$('start').disabled=false;loading=false;}
};
document.querySelectorAll('[data-key]').forEach(button=>{const key=Number(button.dataset.key),source='touch:'+key;button.onpointerdown=e=>{e.preventDefault();if(!engine)return;button.setPointerCapture(e.pointerId);button.classList.add('held');engine.getInputHandler().injectKey(key,true,source);};const release=()=>{button.classList.remove('held');engine?.getInputHandler().injectKey(key,false,source);};button.onpointerup=button.onpointercancel=button.onlostpointercapture=release;});
$('fullscreen').onclick=()=>{const stage=document.querySelector('.stage');(document.fullscreenElement?document.exitFullscreen():stage.requestFullscreen()).catch(()=>{});};
document.addEventListener('visibilitychange',()=>{if(!engine)return;if(document.hidden){engine.pause();engine.getInputHandler().releaseAll();}else engine.resume();});window.addEventListener('pagehide',()=>engine?.destroy());
