/* Локальная среда LiveCodes: компиляция в браузере, редактор внутри нашего окна. */
(() => {
  const aliases={js:'javascript',ts:'typescript',php:'php-wasm',ruby:'ruby-wasm',go:'go-wasm',lua:'lua-wasm',cpp:'cpp-wasm',c:'cpp-wasm',cs:'csharp-wasm',csharp:'csharp-wasm',ml:'ocaml',lisp:'commonlisp'};
  const supported=new Set(['html','css','scss','javascript','typescript','jsx','tsx','python','python-wasm','php-wasm','ruby-wasm','go-wasm','lua-wasm','cpp-wasm','csharp-wasm','java','java-wasm','java-8','perl','ocaml','commonlisp','sql','markdown','mermaid','pug','json','yaml','toml','regex']);
  const titles={javascript:'JavaScript',typescript:'TypeScript','php-wasm':'PHP','ruby-wasm':'Ruby','go-wasm':'Go','lua-wasm':'Lua','cpp-wasm':'C/C++','csharp-wasm':'C#',java:'Java',html:'HTML',css:'CSS',scss:'SCSS',sql:'SQL',markdown:'Markdown',perl:'Perl',ocaml:'OCaml',commonlisp:'Common Lisp'};
  const dialog=document.createElement('dialog');dialog.className='mt-playground';
  dialog.innerHTML='<div class="mt-playground-head"><div><strong data-title>Запуск кода</strong><p>Редактируйте пример и нажмите «Запустить» в редакторе. Выполнение происходит в браузере.</p></div><button type="button" data-close aria-label="Закрыть редактор">×</button></div><p data-info role="status"></p><div data-editor></div><p class="mt-playground-foot">При первом запуске загружаются библиотеки выбранного языка. <a href="/code-playground/LICENSE.txt" target="_blank" rel="noopener noreferrer">LiveCodes / MIT</a></p>';
  document.body.append(dialog);
  const host=dialog.querySelector('[data-editor]'),info=dialog.querySelector('[data-info]');
  let playground,generation=0;
  function destroy(){generation++;playground?.destroy();playground=null;host.replaceChildren()}
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',destroy);
  window.MultitoolPlayground={async open(source){
    destroy();const current=generation;
    const config=structuredClone(source);
    const active=config.activeEditor||'script';let entry=config[active]||{};
    let language=aliases[entry.language]||entry.language;
    const content=entry.content||'';
    dialog.querySelector('[data-title]').textContent='Запуск '+(entry.title||titles[language]||language||'кода');
    info.textContent='Загружается редактор…';dialog.showModal();
    if(!supported.has(language)){
      info.textContent='Для языка '+language+' в этой сборке нет браузерного исполнителя. Пример можно просмотреть и скопировать здесь.';
      const field=document.createElement('textarea');field.value=content;field.setAttribute('aria-label','Код примера');host.append(field);return;
    }
    if(['json','yaml','toml','regex'].includes(language)){
      info.textContent='Этот формат описывает данные или выражения. Для исполнения программы выберите пример на языке программирования.';
      const field=document.createElement('textarea');field.value=content;field.setAttribute('aria-label','Код примера');host.append(field);return;
    }
    const target=['html','markdown','mermaid','pug'].includes(language)?'markup':['css','scss'].includes(language)?'style':'script';
    // Убираем чужие слоты: SQL и прочие языки исходный справочник иногда относит к HTML.
    config.markup={language:'html',content:''};config.style={language:'css',content:''};config.script={language:'javascript',content:''};
    config[target]={language,content};config.activeEditor=target;
    if(language==='sql'){
      config.markup.content='<div id="tables"></div><script>livecodes.sql.render("#tables").catch(console.error);livecodes.sql.getResult().then(console.log).catch(console.error);<\/script>';
      config.style.content='body{font:15px system-ui;color:#e8f1e8;background:#111a16;padding:16px}table{border-collapse:collapse}td,th{border:1px solid #536b55;padding:8px 16px}';
    }
    if(target==='style')config.markup.content='<main><h1>Пример стилей</h1><p>Изменяйте CSS слева, чтобы увидеть результат.</p><button class="button">Кнопка</button><div class="box">Блок</div></main>';
    config.editor='codejar';config.theme='dark';config.appLanguage='ru';config.autoupdate=false;config.tools={status:'open',active:'console'};
    try{
      const {createPlayground}=await import('/code-playground/sdk/livecodes.js');
      if(!dialog.open||current!==generation)return;
      const result=await createPlayground(host,{appUrl:location.origin+'/code-playground/',config});
      if(!dialog.open||current!==generation){result.destroy();return}
      playground=result;info.textContent='';
    }catch(error){if(current===generation)info.textContent='Не удалось загрузить редактор: '+String(error)}
  }};
  // Добавляем запуск и на страницах, где оригинальный справочник не выводил кнопку.
  for(const code of document.querySelectorAll('pre > code')){
    const rawLanguage=Array.from(code.classList).find(c=>c.startsWith('language-'))?.slice(9);
    const language=aliases[rawLanguage]||rawLanguage;
    if(!supported.has(language)||language.startsWith('python')||['json','yaml','toml','regex'].includes(language)||code.parentElement.querySelector('button.from-purple-500'))continue;
    const button=document.createElement('button');button.type='button';button.className='mt-python-run';button.textContent='▶';button.title='Запустить '+rawLanguage;button.setAttribute('aria-label',button.title);
    code.parentElement.style.position='relative';code.before(button);
    button.addEventListener('click',()=>window.MultitoolPlayground.open({activeEditor:'script',script:{language:rawLanguage,content:code.textContent}}));
  }
})();
