/* Перевод только видимого интерфейса: переменные, ключи хранилища и правила игры не меняются. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('lang')==='original')return;
  const gameName=location.pathname.split('/').at(-1).replace(/\.html$/,''),context=window.MultitoolContextDictionary?.[gameName]||{};
  const translate=window.MultitoolGameTranslation.createTranslator(window.MultitoolGameLocale||{strings:{},templates:[]},window.MultitoolReviewedDictionary||{},context);
  // Диалоги импорта и игровые ошибки тоже видны игроку, но не входят в DOM.
  for(const name of ['alert','confirm','prompt']){const original=window[name];window[name]=function(message,...args){return original.call(window,translate(String(message)),...args);};}
  // Не сплющиваем кириллицу по ширине исходных иероглифов. При явном лимите
  // уменьшается размер всего шрифта с сохранением пропорций букв.
  if(window.CanvasRenderingContext2D){const proto=CanvasRenderingContext2D.prototype,measure=proto.measureText;for(const name of ['fillText','strokeText']){const original=proto[name];proto[name]=function(text,x,y,maxWidth){const translated=translate(String(text));if(translated===String(text))return maxWidth===undefined?original.call(this,text,x,y):original.call(this,text,x,y,maxWidth);const transform=this.getTransform(),scale=Math.hypot(transform.a,transform.b)||1,px=transform.a*x+transform.c*y+transform.e;const available=(['center'].includes(this.textAlign)?2*Math.min(px,this.canvas.width-px):['right','end'].includes(this.textAlign)?px:this.canvas.width-px)/scale;const bound=Math.max(20,Math.min(maxWidth??Infinity,available-8)),width=measure.call(this,translated).width,oldFont=this.font;
      if(width>bound){const size=oldFont.match(/([\d.]+)px/);if(size)this.font=oldFont.replace(size[0],Math.max(11,Number(size[1])*bound/width)+'px');}
      let output=translated;if(measure.call(this,output).width>bound){while(output.length>1&&measure.call(this,output+'…').width>bound)output=output.slice(0,-1);output+='…';}
      try{return original.call(this,output,x,y);}finally{this.font=oldFont;}
    };}proto.measureText=function(text){return measure.call(this,translate(String(text)));};}
  // Не обрабатываем поля ввода, исходный код и скрытые шаблоны.
  const skip='script,style,textarea,code,pre,[contenteditable="true"],[data-no-translate]';
  function textNode(node){if(node.parentElement?.closest(skip))return;const ballButtons={splitBtn:'÷',ejectBtn:'●',pauseBtn:'Ⅱ',musicBtn:'♫',menuBtn:'≡',restartBtn:'↻'};const value=gameName==='ball-arena'&&ballButtons[node.parentElement?.id]?ballButtons[node.parentElement.id]:translate(node.data);if(node.data!==value)node.data=value;}
  function element(el){if(!(el instanceof Element)||el.matches(skip))return;if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.setAttribute('value',el.textContent);if(el.matches('input[type=button],input[type=submit],input[type=reset]'))el.value=translate(el.value);for(const name of ['title','placeholder','aria-label','alt']){const raw=el.getAttribute(name);if(raw!==null){const value=translate(raw);if(value!==raw)el.setAttribute(name,value);}}}
  function walk(root){if(root.nodeType===3){textNode(root);return;}if(root.nodeType!==1||root.matches(skip))return;element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)textNode(node);else element(node);}}
  const observer=new MutationObserver(records=>{for(const m of records){if(m.type==='characterData')textNode(m.target);else if(m.type==='attributes')element(m.target);else m.addedNodes.forEach(walk);}});
  document.addEventListener('DOMContentLoaded',()=>{document.documentElement.lang='ru';const style=document.createElement('style');style.textContent='button{min-width:0!important;max-width:100%;white-space:normal!important;overflow-wrap:normal;word-break:normal;hyphens:auto}.layout>*,.app>*,.metrics>*,.record-grid>*,.panel,.board,.panel-inner,.stats>*{min-width:0;overflow-wrap:normal;word-break:normal;hyphens:auto}';document.head.append(style);walk(document.body);document.title=translate(document.title);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});});
})();
