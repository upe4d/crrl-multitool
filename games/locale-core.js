/* Полные фразы и именованные подстановки. Словарная склейка отдельных иероглифов запрещена. */
(function(root){
 'use strict';
 function createTranslator(locale,reviewed={},context={}){
  const normalize=value=>value.replace(/\s+/gu,' ').trim(),exact=new Map(),cache=new Map(),patterns=[];
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const literalPattern=value=>escape(value.replace(/\s+/gu,' ')).replace(/ /g,'\\s+');
  for(const [source,ru] of Object.entries({...reviewed,...locale.strings,...context}))exact.set(normalize(source),ru);
  for(const item of locale.templates||[]){
   const tokens=[...item.source.matchAll(/\{([a-zA-Z]\w*)\}/g)];if(!tokens.length)continue;
   let cursor=0,pattern='^';const names=[];
   for(const token of tokens){pattern+=literalPattern(item.source.slice(cursor,token.index))+'(.*?)';names.push(token[0]);cursor=token.index+token[0].length;}
   pattern+=literalPattern(item.source.slice(cursor))+'$';
   const literal=item.source.replace(/\{\w+\}/g,'').trim(),literalLength=literal.length;if(!literalLength||(literalLength===1&&!/[\u3400-\u9fff]/u.test(literal)))continue;
   patterns.push({regex:new RegExp(pattern,'u'),ru:item.ru,names,literalLength});
  }
  patterns.sort((a,b)=>b.literalLength-a.literalLength||a.names.length-b.names.length);
  function translate(raw,depth=0){
   if(typeof raw!=='string'||!raw.trim()||raw.length>12000||depth>5)return raw;
   if(cache.has(raw))return cache.get(raw);const key=normalize(raw);let result=exact.get(key);
   if(result===undefined){
    for(const pattern of patterns){const match=key.match(pattern.regex);if(!match)continue;const values=new Map(pattern.names.map((name,i)=>[name,translate(match[i+1].trim(),depth+1)]));result=pattern.ru.replace(/\{[a-zA-Z]\w*\}/g,token=>values.get(token)??token);break;}
   }
   // Списки из отдельных названий переводятся по элементам, без пословной склейки.
   if(result===undefined&&depth<3){const parts=key.split(/(\s+[·|/]\s+|\n+)/u);if(parts.length>1){const translated=parts.map((part,i)=>i%2?part:translate(part,depth+1));if(translated.some((part,i)=>part!==parts[i]))result=translated.join('');}}
   // Метка и значение иногда соединяются игровым кодом без текстового шаблона.
   if(result===undefined){const pair=key.match(/^(.*?)(\s*[+−\-]?\d[\d\s.,:%/×x+-]*)$/u);if(pair&&exact.has(normalize(pair[1])))result=exact.get(normalize(pair[1]))+' '+pair[2].trim();}
   result??=raw;if(cache.size>16000)cache.clear();cache.set(raw,result);return result;
  }
  return translate;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={createTranslator};else root.MultitoolGameTranslation={createTranslator};
})(typeof window==='undefined'?globalThis:window);
