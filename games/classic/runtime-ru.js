/* Перевод статусов оболочки. Текст внутри нативного игрового движка не подменяется. */
(() => {
 const dict={'Fullscreen':'На весь экран','Preparing C-Dogs SDL assets…':'Загружаем C-Dogs SDL…','Preparing GNU FreeDink assets…':'Загружаем FreeDink…','Preparing OpenTyrian2000 assets…':'Загружаем OpenTyrian…','Preparing LibreQuake assets…':'Загружаем LibreQuake…','Preparing OpenTTD assets…':'Загружаем OpenTTD…','Preparing FreeRCT assets…':'Загружаем FreeRCT…','Preparing Neverball assets…':'Загружаем Neverball…'};
 const output=document.getElementById('result');if(!output)return;
 const update=()=>{const raw=output.textContent;if(/^(Игра готова|Загружаем|Не удалось)/.test(raw))return;let text=dict[raw];if(!text){if(/NOT READY|failed|abort|error/i.test(raw))text='Не удалось загрузить игру. Обновите страницу. Технические сведения: '+raw;else if(/READY|Running|ready|loaded|initialised/i.test(raw))text='Игра готова. Нажмите на игровое поле.';else if(/Preparing|Downloading|Loading|Starting/i.test(raw))text='Загружаем игру… Первый запуск может занять время.';else if(/Saved locally/i.test(raw))text='Игра сохранена в этом браузере.';}if(text&&text!==raw)output.textContent=text;};
 update();new MutationObserver(update).observe(output,{childList:true,characterData:true,subtree:true});
})();
