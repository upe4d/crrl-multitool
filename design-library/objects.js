import * as THREE from 'three';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

// Готовые GLB загружаются по выбору; подпись автора также записана внутрь файлов.
const labels={'furniture':'Мебель','bathroom fixture':'Ванная','animal gear':'Животные','toy or game':'Игрушки','architectural element':'Архитектура','tableware':'Посуда','hand tool':'Инструменты','container':'Ёмкости','stationery':'Канцелярия','building':'Здания','weapon or armour':'Снаряжение','home appliance':'Бытовая техника','musical instrument':'Музыка','garden or outdoor':'Сад','packaging':'Упаковка','machine or industrial':'Промышленность','kitchen appliance':'Кухня','sports equipment':'Спорт','appliances':'Бытовая техника'};
const repo='https://github.com/Sandflow-ai/sand3d/tree/main/programs';
const examples=[
 {title:'Стиральная машина',family:'home appliance',file:'washing-machine.glb'},
 {title:'Ложка',family:'tableware',file:'spoon.glb'},
 {title:'Вилка',family:'tableware',file:'fork.glb'},
 {title:'Грузовой блок',family:'sports equipment',file:'weight-stack.glb'},
 {title:'Кресло',family:'furniture',file:'chair.glb'}
].map(item=>({...item,attribution:'Пример из Sand3D, Apache License 2.0. Преобразовано в GLB.',source:repo}));
const $=id=>document.getElementById(id),canvas=$('scene'),status=$('modelStatus');
const state={items:examples,filtered:examples,page:1,size:10,selected:null};
let renderer,scene,camera,controls,loader,current,request=0;

try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.001,1000);camera.position.set(2,1.5,2);
 scene.add(new THREE.HemisphereLight(0xffffff,0x536957,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(3,6,5);scene.add(sun);
 controls=new OrbitControls(camera,canvas);controls.enableDamping=true;loader=new GLTFLoader();
 const resize=()=>{const width=canvas.clientWidth,height=canvas.clientHeight;if(width&&height){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}};
 new ResizeObserver(resize).observe(canvas);resize();
 (function render(){requestAnimationFrame(render);controls.update();renderer.render(scene,camera);})();
}catch(error){status.textContent='3D-просмотр недоступен в этом браузере. Модель можно скачать.';console.error(error);}

function select(item){
 state.selected=item;$('modelTitle').textContent=item.title;$('downloadModel').href='models/'+item.file;$('downloadModel').download=item.file;
 $('modelAttribution').textContent=item.attribution;$('modelSource').href=item.source||item.dataset||repo;
 document.querySelectorAll('.object-buttons button').forEach(el=>{const active=el.dataset.file===item.file;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
 if(!loader)return;
 const token=++request;status.textContent='Загружаем модель…';loader.load('models/'+item.file,gltf=>{if(token!==request)return;if(current)scene.remove(current);current=gltf.scene;scene.add(current);const box=new THREE.Box3().setFromObject(current),center=box.getCenter(new THREE.Vector3()),dim=box.getSize(new THREE.Vector3()),extent=Math.max(dim.x,dim.y,dim.z)||1;controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(extent*1.6,extent*1.05,extent*1.6));camera.near=extent/1000;camera.far=extent*100;camera.updateProjectionMatrix();controls.minDistance=extent*.3;controls.maxDistance=extent*10;controls.update();status.textContent='Модель готова к просмотру';},undefined,()=>{if(token===request)status.textContent='Не удалось открыть модель. Попробуйте ещё раз.';});
}
function render(){
 const grid=$('objectButtons');grid.replaceChildren();const pages=Math.max(1,Math.ceil(state.filtered.length/state.size));state.page=Math.min(state.page,pages);$('objectCount').textContent=`Найдено: ${state.filtered.length} · показано по ${state.size}`;
 for(const item of state.filtered.slice((state.page-1)*state.size,state.page*state.size)){const button=document.createElement('button');button.type='button';button.dataset.file=item.file;button.textContent=item.title;button.title=labels[item.family]||item.family;button.classList.toggle('active',state.selected?.file===item.file);button.setAttribute('aria-pressed',String(state.selected?.file===item.file));button.onclick=()=>select(item);grid.append(button);}
 const nav=$('objectPages');nav.replaceChildren();if(pages>1){const prev=document.createElement('button'),next=document.createElement('button'),number=document.createElement('span');prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','Предыдущая страница');next.setAttribute('aria-label','Следующая страница');number.textContent=`${state.page} / ${pages}`;prev.disabled=state.page===1;next.disabled=state.page===pages;prev.onclick=()=>{state.page--;render();};next.onclick=()=>{state.page++;render();};nav.append(prev,number,next);}
}
function filter(){const term=$('objectQuery').value.trim().toLowerCase(),category=$('objectCategory').value;state.filtered=state.items.filter(item=>(!category||item.family===category)&&[item.title,item.family,labels[item.family]||'',item.attribution].join(' ').toLowerCase().includes(term));state.page=1;render();}
$('objectQuery').addEventListener('input',filter);$('objectCategory').addEventListener('change',filter);
$('downloadCredit').addEventListener('click',()=>{if(!state.selected)return;const item=state.selected,text=`${item.title}\n${item.attribution}\nИсточник: ${item.source||item.dataset||repo}\n`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=item.file.replace('.glb','-автор.txt');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
for(const family of [...new Set(state.items.map(item=>item.family))].sort((a,b)=>(labels[a]||a).localeCompare(labels[b]||b,'ru'))){const option=document.createElement('option');option.value=family;option.textContent=labels[family]||family;$('objectCategory').append(option);}
render();
// Локальный пример загружается только при выборе соответствующей вкладки.
function switchView(external){$('externalExplorer').hidden=!external;$('localObjects').hidden=external;for(const [id,active] of [['showExplorer',external],['showLocal',!external]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}if(!external){if(!state.selected)select(examples[0]);window.dispatchEvent(new Event('resize'));}}
$('showExplorer').onclick=()=>switchView(true);$('showLocal').onclick=()=>switchView(false);
