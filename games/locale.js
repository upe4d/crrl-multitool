/* Перевод только видимого интерфейса: переменные, ключи хранилища и правила игры не меняются. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('lang')==='original')return;
  const dict={...window.MultitoolGameDictionary,...window.MultitoolReviewedDictionary},cache=new Map(),trie=Object.create(null),templates=[];
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const [key,value] of Object.entries(dict)){
    if(/^[\u3400-\u9fff]+$/.test(key)&&!/[\u3400-\u9fff]/.test(value)){
      let node=trie;for(const ch of key){node[ch]??=Object.create(null);node=node[ch];}node.$=value;
    }
    const tokens=[...key.matchAll(/\{([a-zA-Z]\w*)\}/g)];
    if(tokens.length&&tokens.length<7&&tokens.every(t=>value.includes(t[0]))){let cursor=0,pattern='^';for(const t of tokens){pattern+=escape(key.slice(cursor,t.index))+'(.+?)';cursor=t.index+t[0].length;}pattern+=escape(key.slice(cursor))+'$';templates.push([new RegExp(pattern),value,tokens.map(t=>t[0])]);}
  }
  function translate(raw){
    if(typeof raw!=='string'||!raw.trim()||raw.length>12000)return raw;if(cache.has(raw))return cache.get(raw);
    let result=dict[raw],trimmed=raw.trim();if(result!==undefined&&/[\u3400-\u9fff]/.test(result))result=undefined;if(result===undefined&&dict[trimmed]!==undefined)result=raw.replace(trimmed,dict[trimmed]);
    if(result===undefined){for(const [pattern,value,tokens] of templates){const m=raw.match(pattern);if(m){result=value;tokens.forEach((token,i)=>{result=result.split(token).join(m[i+1]);});break;}}}
    if(result===undefined&&/[\u3400-\u9fff]/.test(raw)){
      result=raw.replace(/[\u3400-\u9fff]+/g,part=>{if(dict[part]!==undefined)return dict[part];let out='';for(let i=0;i<part.length;){let node=trie,j=i,end=i,value;while(j<part.length&&node[part[j]]){node=node[part[j++]];if(node.$!==undefined){end=j;value=node.$;}}if(value!==undefined){if(/[а-яё]$/i.test(out)&&/^[а-яё]/i.test(value))out+=' ';out+=value;i=end;}else out+=part[i++];}return out;});
    }
    result??=raw;if(cache.size>12000)cache.clear();cache.set(raw,result);return result;
  }
  // Не сплющиваем кириллицу по ширине исходных иероглифов. При явном лимите
  // уменьшается размер всего шрифта с сохранением пропорций букв.
  if(window.CanvasRenderingContext2D){const proto=CanvasRenderingContext2D.prototype,measure=proto.measureText;for(const name of ['fillText','strokeText']){const original=proto[name];proto[name]=function(text,x,y,maxWidth){const translated=translate(String(text));if(translated===String(text))return maxWidth===undefined?original.call(this,text,x,y):original.call(this,text,x,y,maxWidth);const transform=this.getTransform(),scale=Math.hypot(transform.a,transform.b)||1,px=transform.a*x+transform.c*y+transform.e;const available=(['center'].includes(this.textAlign)?2*Math.min(px,this.canvas.width-px):['right','end'].includes(this.textAlign)?px:this.canvas.width-px)/scale;const bound=Math.max(20,Math.min(maxWidth??Infinity,available-8)),width=measure.call(this,translated).width,oldFont=this.font;
      if(width>bound){const size=oldFont.match(/([\d.]+)px/);if(size)this.font=oldFont.replace(size[0],Math.max(11,Number(size[1])*bound/width)+'px');}
      let output=translated;if(measure.call(this,output).width>bound){while(output.length>1&&measure.call(this,output+'…').width>bound)output=output.slice(0,-1);output+='…';}
      try{return original.call(this,output,x,y);}finally{this.font=oldFont;}
    };}proto.measureText=function(text){return measure.call(this,translate(String(text)));};}
  // Не обрабатываем поля ввода, исходный код и скрытые шаблоны.
  const skip='script,style,textarea,code,pre,[contenteditable="true"],[data-no-translate]';
  function textNode(node){if(node.parentElement?.closest(skip))return;const value=translate(node.data);if(node.data!==value)node.data=value;}
  function element(el){if(!(el instanceof Element)||el.matches(skip))return;for(const name of ['title','placeholder','aria-label','alt']){const raw=el.getAttribute(name);if(raw!==null){const value=translate(raw);if(value!==raw)el.setAttribute(name,value);}}}
  function walk(root){if(root.nodeType===3){textNode(root);return;}if(root.nodeType!==1||root.matches(skip))return;element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)textNode(node);else element(node);}}
  const observer=new MutationObserver(records=>{for(const m of records){if(m.type==='characterData')textNode(m.target);else if(m.type==='attributes')element(m.target);else m.addedNodes.forEach(walk);}});
  document.addEventListener('DOMContentLoaded',()=>{document.documentElement.lang='ru';const style=document.createElement('style');style.textContent='button{min-width:0!important;max-width:100%;white-space:normal!important;overflow-wrap:normal;word-break:normal;hyphens:auto}.layout>*,.app>*,.metrics>*,.record-grid>*,.panel,.board,.panel-inner,.stats>*{min-width:0;overflow-wrap:normal;word-break:normal;hyphens:auto}';document.head.append(style);walk(document.body);document.title=translate(document.title);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label','alt']});});
})();
