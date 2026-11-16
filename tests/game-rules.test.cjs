// Проверяем опасные для правил случаи на настоящем движке, а не копии алгоритма.
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');const root=path.join(__dirname,'../games'),E=require(path.join(root,'board/checkers-engine.js'));
const empty=()=>Array(64).fill(0),at=(r,c)=>r*8+c;
assert.equal(E.moves(E.initial(),1).length,7);
let b=empty();b[at(3,2)]=1;b[at(4,3)]=-1;let m=E.moves(b,1);assert.equal(m.length,1);assert.deepEqual(m[0].path,[at(3,2),at(5,4)]);assert.equal(E.apply(b,m[0])[at(4,3)],0);
b=empty();b[at(6,1)]=2;b[at(3,4)]=-1;m=E.moves(b,1);assert.equal(m.length,3);assert(m.every(x=>x.taken.length===1));
b=empty();b[at(2,1)]=1;b[at(1,2)]=-1;b[at(2,5)]=-1;m=E.moves(b,1);assert(m.some(x=>x.piece===2&&x.taken.length===2&&x.path[1]===at(0,3)));
b=empty();b[at(4,3)]=2;b[at(3,4)]=-1;b[at(5,2)]=-1;m=E.moves(b,1);assert(m.every(x=>x.taken.length===1),'Captured pieces block the return diagonal');
const initial=E.initial(),best=E.best(initial,1,500);assert(E.moves(initial,1).some(x=>JSON.stringify(x)===JSON.stringify(best)));
// Сто случайных партий не теряют и не дублируют фигуры, поиск возвращает законный ход.
for(let game=0;game<100;game++){let board=E.initial(),side=1;for(let turn=0;turn<150;turn++){const moves=E.moves(board,side);if(!moves.length)break;const move=moves[Math.floor(Math.random()*moves.length)],before=board.filter(Boolean).length;board=E.apply(board,move);assert.equal(board.filter(Boolean).length,before-move.taken.length);assert(board.every(x=>[-2,-1,0,1,2].includes(x)));side=-side;}}
class Element{constructor(){this.children=[];this.dataset={};this.style={};this.classList={toggle(){}};this.value='ai';this.hidden=true;}setAttribute(){}append(...x){this.children.push(...x);}replaceChildren(...x){this.children=x;}querySelector(){return new Element();}showModal(){}close(){}}
const elements={};let stored='',timers=[];const context={document:{getElementById:id=>elements[id]??=new Element(),createElement:()=>new Element()},localStorage:{getItem:()=>null,setItem:(_,s)=>stored=s},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{timers=[];},console,Math};
vm.runInNewContext(fs.readFileSync(path.join(root,'board/domino.js'),'utf8'),context);
for(let game=0;game<200;game++){
 if(game)elements.new.onclick();let completed=false;
 for(let step=0;step<200;step++){
  const state=JSON.parse(stored),all=[...state.hands.flat(),...state.stock,...state.chain];assert.equal(all.length,28);assert.equal(new Set(all.map(t=>t.slice().sort().join())).size,28);
  if(state.over){completed=true;break;}
  if(state.turn===1){const next=timers.shift();assert(next);next();continue;}
  const hand=elements.hand.children,available=hand.find(t=>!t.disabled);
  if(available){available.onclick();const button=!elements['place-left'].disabled?elements['place-left']:elements['place-right'];assert(!button.disabled);button.onclick();}
  else if(!elements.draw.disabled)elements.draw.onclick();else{assert(!elements.pass.disabled);elements.pass.onclick();}
 }
 assert(completed,'Domino game must terminate');
}
const ru=JSON.parse(fs.readFileSync(path.join(root,'locales/night-fair.ru.json'),'utf8'));assert.equal(Object.keys(ru).length,64);for(const value of Object.values(ru))assert(!/[\u3400-\u9fff]/.test(JSON.stringify(value)));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));assert.equal(catalog.length,182);assert.equal(new Set(catalog.map(x=>x.id)).size,182);assert.equal(new Set(catalog.map(x=>x.url)).size,182);
for(const game of catalog){assert(game.controls.length>30);for(const url of[game.path,game.originalPath])assert(fs.existsSync(path.join(root,'..',url.split(/[?#]/)[0])),'Missing '+url);}
const wasm=new WebAssembly.Module(fs.readFileSync(path.join(root,'classic/doom/doom.wasm')));assert(WebAssembly.Module.exports(wasm).some(x=>x.name==='initGame'));assert(WebAssembly.Module.exports(wasm).some(x=>x.name==='tickGame'));
console.log('PASS: Russian checkers edge cases + 100 games; 200 complete domino games; 64 reviewed dictionaries; 182 unique local game entries; Doom WASM exports.');
