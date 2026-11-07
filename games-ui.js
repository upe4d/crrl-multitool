(()=>{
'use strict';
const PAGE_SIZE=12;
let games=null,previews={},loading=null,page=1,activeCategory='',expandedCategories=false;
const node=s=>document.querySelector(s);
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e};
const categoryLabels={'Action games':'Экшен','Adventure games':'Приключения','Business and Tycoon games':'Бизнес и тайкуны','City-Building games':'Строительство городов','First-Person games':'От первого лица','Platformers':'Платформеры','Puzzle games':'Головоломки','Racing games':'Гонки','Real-Time strategies':'Стратегии в реальном времени','Roguelikes':'Рогалики','Role-Playing games':'Ролевые игры','Sandbox games':'Песочницы',"Shoot 'em up games":'Аркадные шутеры','Sport games':'Спорт','Third-Person games':'От третьего лица','Tower Defense games':'Защита башен','Tower Defence games':'Защита башен','Turn-Based strategies':'Пошаговые стратегии'};
const labelCategory=value=>categoryLabels[value]||value;
function link(url,label){const a=text('a',label);try{const u=new URL(url);if(['https:','http:'].includes(u.protocol)){a.href=u.href;a.target='_blank';a.rel='noopener noreferrer'}}catch{}return a}
function previewFor(game){
 const official=previews[game.name]?.url;
 if(official){try{const u=new URL(official);if(u.protocol==='https:')return {url:u.href,label:'Превью проекта'}}catch{}}
 try{const u=new URL(game.source);if(u.hostname==='github.com'){const parts=u.pathname.split('/').filter(Boolean);if(parts.length>=2)return {url:`https://opengraph.githubassets.com/1/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`,label:'Превью репозитория'}}}catch{}
 return null;
}
function ensureLayout(){
 const category=node('#gamesCategory');if(!category)return;
 const label=category.closest('label');if(label)label.classList.add('games-category-original');
 if(!node('#gamesCategories')){const holder=document.createElement('div');holder.className='games-filter';holder.innerHTML='<span class="games-filter-label">Жанры</span><div id="gamesCategories" class="games-categories" aria-label="Жанр игры"></div>';node('.games-controls').after(holder)}
 if(!node('#gamesPagination')){const nav=document.createElement('nav');nav.id='gamesPagination';nav.className='games-pagination';nav.setAttribute('aria-label','Страницы каталога игр');node('#gamesResults').after(nav)}
}
function renderCategories(){
 const root=node('#gamesCategories');root.replaceChildren();
 const categories=['',...new Set(games.map(x=>x.category))];
 root.classList.toggle('is-expanded',expandedCategories);
 const side=node('#sideGamesGenres');if(side)side.replaceChildren();
 for(const [index,category] of categories.entries()){
  const selectCategory=()=>{activeCategory=category;page=1;node('#gamesCategory').value=category;render()};
  const label=category?labelCategory(category):'Все игры';
  const button=text('button',label,'games-category');button.type='button';button.classList.toggle('games-category-extra',index>5);button.classList.toggle('is-active',category===activeCategory);button.setAttribute('aria-pressed',String(category===activeCategory));button.onclick=()=>{selectCategory();root.querySelector('.is-active')?.focus({preventScroll:true})};root.append(button);
  if(side){const item=text('button',label,'side-game-genre');item.type='button';item.classList.toggle('active',category===activeCategory);item.setAttribute('aria-pressed',String(category===activeCategory));item.onclick=()=>{selectCategory();if(matchMedia('(max-width:650px)').matches&&document.body.classList.contains('menu-open')){const toggle=node('.sections-toggle');toggle.click();toggle.focus({preventScroll:true})}else side.querySelector('.active')?.focus({preventScroll:true})};side.append(item)}
 }
 if(categories.length>6){const toggle=text('button',expandedCategories?'Свернуть':'Все жанры · '+(categories.length-1),'games-category games-category-toggle');toggle.type='button';toggle.setAttribute('aria-expanded',String(expandedCategories));toggle.onclick=()=>{expandedCategories=!expandedCategories;renderCategories()};root.append(toggle)}
}
function pageButton(label,value,disabled,current=false){const b=text('button',label,'games-page-button');b.type='button';b.disabled=disabled;if(current){b.classList.add('is-current');b.setAttribute('aria-current','page')}b.onclick=()=>{page=value;render();node('#gamesResults').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})};return b}
function pagination(total){const root=node('#gamesPagination');root.replaceChildren();const count=Math.ceil(total/PAGE_SIZE);if(count<=1)return;root.append(pageButton('← Назад',page-1,page===1));let first=Math.max(1,Math.min(page-2,count-4)),last=Math.min(count,first+4);for(let i=first;i<=last;i++)root.append(pageButton(String(i),i,false,i===page));root.append(pageButton('Далее →',page+1,page===count))}
function gameCard(game){
 const row=document.createElement('article');row.className='game-item';
 const media=document.createElement('div');media.className='game-media';const preview=previewFor(game);
 const fallback=text('span','Превью недоступно','game-media-fallback');media.append(fallback);
 if(preview){const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.alt=`${game.name} — ${preview.label.toLowerCase()}`;img.onload=()=>media.classList.add('has-image');img.onerror=()=>{img.remove();media.classList.remove('has-image')};img.src=preview.url;media.prepend(img);const credit=text('span',preview.label,'game-media-credit');media.append(credit)}
 const body=document.createElement('div');body.className='game-body';const category=text('span',labelCategory(game.category),'game-genre');const title=text('h3',game.name,'game-title');const description=text('p',game.description||'Подробнее на странице проекта','game-description');const actions=document.createElement('div');actions.className='game-links';if(game.homepage)actions.append(link(game.homepage,'Сайт игры ↗'));if(game.source)actions.append(link(game.source,'Исходный код ↗'));if(!actions.children.length)actions.append(text('span','Ссылка не указана','game-link-empty'));body.append(category,title,description,actions);row.append(media,body);return row;
}
function projectsWord(n){const last=n%10,lastTwo=n%100;return last===1&&lastTwo!==11?'проект':last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?'проекта':'проектов'}
function render(){
 const q=node('#gamesQuery').value.trim().toLocaleLowerCase('ru');const items=games.filter(x=>(!activeCategory||x.category===activeCategory)&&(`${x.name} ${x.description} ${x.category} ${labelCategory(x.category)}`).toLocaleLowerCase('ru').includes(q));const total=items.length;page=Math.max(1,Math.min(page,Math.max(1,Math.ceil(total/PAGE_SIZE))));const start=(page-1)*PAGE_SIZE;node('#gamesCount').textContent=total?`${start+1}–${Math.min(start+PAGE_SIZE,total)} из ${total} ${projectsWord(total)}`:'Ничего не найдено';const root=node('#gamesResults');root.replaceChildren();for(const game of items.slice(start,start+PAGE_SIZE))root.append(gameCard(game));if(!total)root.append(text('p','Попробуйте изменить запрос или выбрать другой жанр','games-empty'));renderCategories();pagination(total);
}
async function load(){
 if(games)return;if(loading)return loading;
 loading=(async()=>{const [catalog,images]=await Promise.all([fetch('./games-catalog.json'),fetch('./games-previews.json').catch(()=>null)]);if(!catalog.ok)throw Error('Каталог недоступен');games=await catalog.json();if(images&&images.ok){try{previews=await images.json()}catch{previews={}}}const select=node('#gamesCategory');select.replaceChildren(new Option('Все жанры',''));for(const category of [...new Set(games.map(x=>x.category))])select.add(new Option(labelCategory(category),category));ensureLayout();render()})().finally(()=>{loading=null});return loading;
}
window.initGames=()=>load().catch(e=>node('#gamesCount').textContent=e.message);
node('#gamesQuery').addEventListener('input',()=>{page=1;if(games)render()});node('#gamesCategory').addEventListener('change',e=>{activeCategory=e.target.value;page=1;if(games)render()});
})();
