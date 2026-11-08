(()=>{'use strict';if(window.self===window.top)return;
// Отдельная страница сохраняет стандартную высоту PrivateBin; внутри мультитула — высота по содержимому.
document.documentElement.classList.add('multitool-embedded');let timer;
function post(){clearTimeout(timer);timer=setTimeout(()=>{const body=document.body;if(!body)return;const footer=document.querySelector('footer');const bottom=footer?footer.getBoundingClientRect().bottom+window.scrollY:body.getBoundingClientRect().bottom+window.scrollY;const measured=Math.max(400,Math.ceil(bottom+2));window.parent.postMessage({type:'multitool-note-height',height:measured},location.origin)},80)}
addEventListener('load',post);addEventListener('resize',post);new MutationObserver(post).observe(document.documentElement,{childList:true,subtree:true,attributes:true,characterData:true});if(window.ResizeObserver)new ResizeObserver(post).observe(document.documentElement);post()})();
