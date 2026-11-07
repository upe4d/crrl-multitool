(()=>{
'use strict';
const textHelp={
 counter:[['Что считается','Символы, символы без пробелов, слова и строки.'],['Подсказка','Слова разделяются пробелами и переносами строк.']],
 case:[['Режимы','Выберите прописные, строчные или регистр как в предложении.'],['Результат','Полученный текст можно скопировать или скачать.']],
 sort:[['Порядок','Строки сортируются по алфавиту; числа внутри строк учитываются целиком.'],['Варианты','Доступна сортировка по возрастанию и по убыванию.']],
 unique:[['Что останется','Сохраняется первое вхождение каждой строки.'],['Регистр','Строки с разным регистром считаются разными.']],
 frequency:[['Подсчёт','Слова подсчитываются без учёта регистра и сортируются по частоте.'],['Результат','Напротив каждого слова показано число его повторений.']],
 repeat:[['Количество','Можно указать от 1 до 1000 повторений.'],['Разделитель','Выберите перенос строки, пробел или повторение без разделителя. Максимум — 1 млн символов.']],
 morse:[['Алфавит','Выберите русский или английский язык и направление преобразования.'],['Запись','Буквы разделяются пробелами, слова — знаком /. При декодировании Ё становится Е.']],
 binary:[['Кодирование','Текст превращается в восьмибитные группы UTF-8.'],['Обратно','Введите нули и единицы; число бит должно делиться на восемь.']],
 lorem:[['Количество','Создайте от 1 до 20 абзацев примерного текста.'],['Использование','Текст подойдёт для проверки макета до появления готового содержания.']],
 json:[['Проверка','Инструмент проверяет структуру JSON перед преобразованием.'],['Режимы','Форматируйте JSON для чтения или убирайте лишние пробелы.']],
 base64:[['Текст','Кодируйте и декодируйте текст в формате UTF-8.'],['Проверка','Для декодирования нужна корректная строка Base64.']],
 url:[['Применение','Кодируйте часть ссылки или возвращайте закодированному тексту исходный вид.'],['Пример','Пробелы и специальные символы преобразуются в безопасную запись.']],
 hash:[['SHA-256','Создаёт строку хеша для введённого текста.'],['Сравнение','Одинаковый текст даёт одинаковый результат; изменение символа меняет хеш.']],
 password:[['Длина','Выберите от 12 до 128 символов.'],['Состав','Пароль содержит буквы, цифры и специальные символы.']],
 uuid:[['Формат','Создаётся случайный идентификатор UUID версии 4.'],['Применение','Идентификатор можно скопировать или сохранить в TXT.']]
};
const imageHelp={
 resize:[['Размер','Введите ширину и высоту в пикселях.'],['Пропорции','Оставьте галочку, чтобы стороны изменялись согласованно.']],
 crop:[['Область','Укажите координаты верхнего левого угла и размер выделения.'],['Границы','Область должна находиться внутри исходного изображения.']],
 rotate:[['Поворот','Выберите 90°, 180° или 270° по часовой стрелке.'],['Результат','После поворота на 90° или 270° ширина и высота меняются местами.']],
 clean:[['Метаданные','При пересохранении исходные метаданные изображения не переносятся.'],['Копия','Исходный файл не изменяется; скачайте обработанное изображение.']]
};
const calcHelp={
 percent:[['Три задачи','Найдите процент от числа, долю от целого или изменение между значениями.'],['Важно','При расчёте доли и изменения делитель не должен быть равен нулю.']],
 units:[['Величины','Доступны единицы длины, массы и температуры.'],['Температура','Поддерживаются Цельсий, Фаренгейт и Кельвин.']],
 age:[['Даты','Укажите дату рождения и дату, на которую нужен расчёт.'],['Результат','Возраст показан в полных годах, месяцах и днях.']],
 aspect:[['Пропорции','Введите исходные ширину и высоту и новый размер одной стороны.'],['Результат','Вторая сторона рассчитывается с сохранением соотношения.']],
 timestamp:[['Направление','Переводите местную дату в Unix-время или Unix-время в дату.'],['Единицы','Для Unix-времени можно выбрать секунды или миллисекунды.']],
 bases:[['Основание','Поддерживаются системы счисления от 2 до 36.'],['Число','Для цифр старше 9 используйте латинские буквы A–Z.']],
 'unit-price':[['Сравнение','Укажите цену и количество для нескольких предложений.'],['Единицы','Сравнивайте товары в одинаковых единицах и одной валюте: результат покажет цену за единицу.']]
};
const pdfHelp={
 merge:[['Порядок','Выберите минимум два PDF в том порядке, в котором их нужно объединить.'],['Объём','Всего до 100 страниц; документы с паролем не поддерживаются.']],
 split:[['Режим','Сохраните каждую страницу отдельно или выберите диапазон.'],['Пример','Для выбранных страниц используйте запись 1-3, 5.']],
 compress:[['Сжатие','Документ сохраняется без потери качества.'],['Результат','Если уменьшить файл не удалось, сохранится исходная версия.']],
 ocr:[['Распознавание','Выберите русский, английский или оба языка.'],['Результат','До 30 страниц; текст сохраняется в TXT. Качество зависит от читаемости скана.']]
};
function wrap(panel,kind){
 if(!panel)return null;
 if(panel.dataset.toolLayout==='ready')return panel.querySelector(':scope > .tool-help');
 const work=document.createElement('div');work.className='tool-workspace '+kind+'-tool-workspace';
 while(panel.firstChild)work.append(panel.firstChild);
 const aside=document.createElement('aside');aside.className='tool-help';aside.setAttribute('aria-label','Подсказки по инструменту');
 panel.append(work,aside);panel.classList.add('tool-layout');panel.dataset.toolLayout='ready';return aside;
}
function show(aside,title,items){if(!aside)return;const heading=document.createElement('h3');heading.textContent=title;const blocks=items.map(([name,detail])=>{const group=document.createElement('div');group.className='tool-help-group';const b=document.createElement('b'),p=document.createElement('p');b.textContent=name;p.textContent=detail;group.append(b,p);return group});aside.replaceChildren(heading,...blocks)}
function updatePdf(){const cards=document.querySelectorAll('#pdf-tools-root .pdf-tool-card');if(cards[0])show(wrap(cards[0],'pdf'),'Пакетная обработка',[['Файлы','Выберите до 25 файлов общим размером не более 100 МБ.'],['Формат','Для всех файлов нужен общий формат результата.'],['Скачивание','Готовые файлы сохраняются ZIP-архивом.']]);if(cards[1]){const action=cards[1].querySelector('[name=action]')?.value||'merge';show(wrap(cards[1],'pdf'),'Работа с PDF',pdfHelp[action]||pdfHelp.merge)}}
function updateText(){const panel=document.querySelector('#text-tools-root .text-tool-panel');if(!panel)return;const selected=document.querySelector('#text-tools-root [data-text-tool][aria-selected=true]')?.dataset.textTool||'counter',mode=document.querySelector('#text-tools-root .text-mode-button[aria-pressed=true]')?.textContent,items=[...(textHelp[selected]||textHelp.counter)];if(mode)items.push(['Выбрано',mode]);show(wrap(panel,'text'),'Об инструменте',items)}
function updateImage(){const panel=document.querySelector('#image-tools-root .image-panel');if(!panel)return;const selected=document.querySelector('#image-tools-root [data-image-mode][aria-pressed=true]')?.dataset.imageMode||'resize';show(wrap(panel,'image'),'Работа с изображением',[...(imageHelp[selected]||imageHelp.resize),['Файлы','PNG, JPEG или WebP; размер до 30 МБ и 32 млн пикселей.']])}
function updateCalculation(){const panel=document.querySelector('#calculation-tools-root .calc-panel');if(!panel)return;const selected=document.querySelector('#calculation-tools-root [data-calc-tool][aria-selected=true]')?.dataset.calcTool||'percent',mode=document.querySelector('#calculation-tools-root .calc-mode[aria-pressed=true]')?.textContent,group=document.querySelector('#calc-unit-group'),items=[...(calcHelp[selected]||calcHelp.percent)];if(mode)items.push(['Выбрано',mode]);else if(selected==='units'&&group)items.push(['Величина',group.selectedOptions[0]?.textContent||'']);show(wrap(panel,'calc'),'О расчёте',items)}
function updateAll(){updatePdf();updateText();updateImage();updateCalculation()}
document.addEventListener('text-tool-change',updateText);
document.addEventListener('image-tool-change',updateImage);
document.addEventListener('calculation-tool-change',updateCalculation);
document.addEventListener('click',event=>{if(event.target.closest('.pdf-action-tabs button'))queueMicrotask(updatePdf);else if(event.target.closest('.text-mode-button'))queueMicrotask(updateText);else if(event.target.closest('.calc-mode'))queueMicrotask(updateCalculation)});
document.addEventListener('change',event=>{if(event.target.closest('#pdfToolForm'))updatePdf();else if(event.target.id==='calc-unit-group')updateCalculation()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateAll,{once:true});else updateAll();
})();
