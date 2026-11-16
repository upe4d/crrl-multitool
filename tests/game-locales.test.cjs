/* Проверяем полные фразы, значения подстановок и неизменность авторских HTML. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../games');
const {createTranslator}=require(path.join(root,'locale-core.js'));const crypto=require('crypto');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'locales/original-html-sha256.json'),'utf8'));let tested=0,design=[];
for(const file of fs.readdirSync(path.join(root,'locales/mini')).filter(f=>f.endsWith('.ru.json'))){
 const data=JSON.parse(fs.readFileSync(path.join(root,'locales/mini',file),'utf8')),t=createTranslator(data);
 for(const [s,r] of Object.entries(data.strings)){assert.equal(t(s),r, data.gameId+' exact '+s);tested++;}
 for(const item of data.templates){
  const ids=[...item.source.matchAll(/\{(v\d+)\}/g)].map(x=>x[1]);
  const source=item.source.replace(/\{(v\d+)\}/g,(_,name)=>'['+name+']');
  const expected=item.ru.replace(/\{(v\d+)\}/g,(_,name)=>'['+name+']');
  // Сравниваем полные шаблоны, не фрагменты конкатенации с открытой HTML-разметкой.
  const actual=t(source);if(actual!==expected)design.push([data.gameId,item.source,actual,expected]);tested++;
 }
}
if(design.length)console.log(design.slice(0,5));
console.log('Exact/template checks:',tested,'template collisions:',design.length);
let changed=[];
for(const [file,hash] of Object.entries(baseline)){
 let s=fs.readFileSync(path.join(root,'mini',file),'utf8').replace(/<script\b[^>]*src=["']\.\.\/(?:locales\/[^"']+|locale(?:-core)?\.js[^"']*)["'][^>]*>\s*<\/script>\s*/g,'');
 if(crypto.createHash('sha256').update(s).digest('hex')!==hash)changed.push(file);
}
console.log('Original HTML unchanged:',106-changed.length,'/106');if(changed.length)console.log('Changed:',changed.slice(0,8));
const t=createTranslator({strings:{'敌人':'Противник'},templates:[{source:'{v0} 对 {v1} 造成 {v2} 伤害。',ru:'{v0} наносит {v2} урона цели {v1}.'}]});
assert.equal(t('敌人 对 Boss 造成 12 伤害。'),'Противник наносит 12 урона цели Boss.');
if(changed.length||design.length)process.exitCode=1;
