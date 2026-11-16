/* Машинный перевод пояснений; код и значения элементов не меняются. */
(() => {
  const ui = {'Search for cheatsheet':'Поиск шпаргалки','Cheat Sheets':'Шпаргалки','for Developers':'для разработчиков','AI':'ИИ','Toolkit':'Инструментарий','Operating System':'Операционные системы','Linux Command':'Команды Linux','Database':'Базы данных','Keyboard Shortcuts':'Горячие клавиши','Game':'Игры','Other':'Другое','Programming':'Программирование','Development':'Разработка','Design':'Дизайн','Tools':'Инструменты','Share':'Поделиться','Copy Link':'Копировать ссылку','Cancel':'Отмена','Popular Quick Reference':'Популярная шпаргалка'};
  Object.assign(ui, {"Strings": "Строки", "JavaScript Conditionals": "Условия JavaScript", "JavaScript Scope": "Область видимости JavaScript", "let Keyword": "Ключевое слово let", "const Keyword": "Ключевое слово const", "if Statement": "Условный оператор if", "else if": "Условие else if", "switch Statement": "Оператор switch", "return Keyword": "Ключевое слово return", "let vs var": "Сравнение let и var", "Loops with closures": "Циклы и замыкания", "Non-existent properties": "Несуществующие свойства", "this Keyword": "Ключевое слово this", "extends": "Ключевое слово extends", "GET": "HTTP-метод GET", "POST": "HTTP-метод POST", "fetch api": "API fetch", "Property .length": "Свойство .length", "While Loop": "Цикл while", "Do…While Statement": "Цикл do…while", "For Loop": "Цикл for", "Break": "Оператор break", "Continue": "Оператор continue", "JavaScript Set": "Множества Set в JavaScript", "Promise states": "Состояния Promise", "Promise.catch()": "Метод Promise.catch()", "Promise.all()": "Метод Promise.all()", "ForEach": "Метод forEach"});
  const original = new WeakMap();
  const note = document.querySelector('.mt-reference-note');
  const oldButton = document.getElementById('mt-reference-language');
  const controls = document.createElement('div');
  controls.className='mt-reference-languages';
  controls.setAttribute('role','group');
  controls.setAttribute('aria-label','Язык пояснений');
  const modes=[['ru','РУС'],['en','ENG'],['both','РУС + ENG']];
  let mode; try { mode=localStorage.getItem('reference_language') || 'both'; } catch { mode='both'; }
  if(!modes.some(([key])=>key===mode))mode='both';
  let translations={}, translationFailed=false;
  const sourceLink=document.createElement('a');sourceLink.href='/reference/source-code.zip';sourceLink.textContent='Исходный код';
  oldButton.before(sourceLink);
  function render() {
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      const parent=node.parentElement;
      if(!parent||parent.closest('head,pre,code,kbd,textarea,script,style,svg,nav,footer,button,.mt-reference-header,.mt-reference-note'))continue;
      // Первый столбец таблицы содержит команды, параметры и имена: сохраняем оригинал.
      if(parent.closest('td:first-child'))continue;
      if(!parent.closest('p,li,td,th,h1,h2,h3,h4,h5,label'))continue;
      const before=original.get(node) ?? node.nodeValue;
      const key=before.trim();
      // Имена методов и переменных, записанные отдельным заголовком, не локализуются.
      const technical=/^(?:[A-Za-z_$][\w$]*\.)*[A-Za-z_$][\w$]*\([^)]*\)$/.test(key);
      const translated=ui[key] || (technical?key:translations[key]);
      if(!translated)continue;
      original.set(node,before);
      const value=mode==='en'?key:mode==='ru'?translated:translated.toLocaleLowerCase()===key.toLocaleLowerCase()?key:translated+' / '+key;
      node.nodeValue=before.replace(key,value);
    }
    for(const button of controls.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
    const input=document.querySelector('#mysearch-input');
    if(input)input.placeholder=mode==='en'?'Search for cheatsheet':'Поиск шпаргалки';
    const message=translationFailed?'Перевод временно недоступен; показан оригинал.':mode==='en'?'Descriptions are machine-translated into Russian. Code and commands stay unchanged.':'Названия и пояснения переведены автоматически; код и команды сохранены как в оригинале.'; if(note.textContent!==message)note.textContent=message;
  }
  for(const [key,label] of modes){
    const button=document.createElement('button');button.type='button';button.dataset.mode=key;button.textContent=label;
    button.addEventListener('click',()=>{mode=key;try{localStorage.setItem('reference_language',mode)}catch{}render()});controls.append(button);
  }
  oldButton.replaceWith(controls);
  render();
  fetch('/reference/translations-ru.json').then(r=>{if(!r.ok)throw Error('translation unavailable');return r.json()}).then(data=>{translations=data;render()}).catch(()=>{translationFailed=true;render()});
  let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(render,120)}).observe(document.body,{childList:true,subtree:true});
})();
