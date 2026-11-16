/* Генератор статических словарей: на хостинге Node.js не требуется. */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'../games/locales/mini');let count=0;
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.ru.json'))){
 const locale=JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
 for(const item of locale.templates){
  const tokens=s=>[...s.matchAll(/\{v\d+\}/g)].map(m=>m[0]).sort().join(',');
  if(tokens(item.source)!==tokens(item.ru))throw Error('Потеряна подстановка: '+name+' '+item.source);
 }
 fs.writeFileSync(path.join(root,name.replace(/\.json$/,'.js')),'/* Перевод видимого текста; исходная механика игры сохранена. */\nwindow.MultitoolGameLocale='+JSON.stringify(locale)+';\n');count++;
}
console.log('Словарей собрано:',count);
