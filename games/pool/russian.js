/* Русские надписи рисуются текстом вместо английских изображений кнопок. */
function installRussianPool(){
  const originalLanguage=new URLSearchParams(location.search).get('lang')==='original';
  const labels={twoPlayersButton:'Два игрока',onePlayersButton:'Против компьютера',easyButton:'Легко',mediumButton:'Средне',hardButton:'Сложно',insaneButton:'Эксперт',continueButton:'Продолжить',backButton:'Назад'};
  const originalDraw=Button.prototype.draw;
  Button.prototype.draw=function(){
    const key=Object.keys(labels).find(k=>sprites[k]===this.sprite);
    if(originalLanguage||!key)return originalDraw.call(this);
    const c=Canvas2D._canvasContext,s=Canvas2D.scale,w=this.sprite.width,h=this.sprite.height,hover=this.mouseInsideBorders();
    c.save();c.scale(s.x,s.y);c.translate(this.position.x,this.position.y);c.fillStyle=hover?'#d2ed9b':'#173d30';c.strokeStyle='#a0c4a8';c.lineWidth=2;c.beginPath();c.roundRect(0,0,w,h,18);c.fill();c.stroke();c.fillStyle=hover?'#14221a':'#fff';c.font='bold 42px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(labels[key],w/2,h/2,w-30);c.restore();if(hover)Canvas2D._canvas.style.cursor='pointer';
  };
  const drawText=Canvas2D.drawText;
  Canvas2D.drawText=function(text,...args){if(!originalLanguage){text=String(text).replace('Classic 8-Ball','Бильярд: восьмёрка').replace('Choose Difficulty','Выберите сложность').replace(/PLAYER (\d)/,'ИГРОК $1');}return drawText.call(this,text,...args);};
  // Подсказка перед партией заменяет исходную картинку с английскими инструкциями.
  const drawImage=Canvas2D.drawImage;
  Canvas2D.drawImage=function(sprite,...args){
    if(sprite!==sprites.controls||originalLanguage)return drawImage.call(this,sprite,...args);
    const lines=['Забейте свои цветные шары, затем чёрную восьмёрку.','Наведите кий мышью. W — сильнее, S — слабее.','Левая кнопка мыши — удар. Esc — меню.','После фола поставьте белый шар щелчком.'];
    lines.forEach((text,i)=>Canvas2D.drawText(text,new Vector2(100,200+i*100),Vector2.zero,'white','left','system-ui','36px'));
  };
  // Экранные клавиши позволяют менять силу и открывать меню без клавиатуры.
  document.querySelectorAll('#pool-touch [data-key]').forEach(button=>{
    const code=Number(button.dataset.key),release=()=>{Keyboard._keyStates[code].down=false;};
    button.onpointerdown=e=>{e.preventDefault();e.stopPropagation();button.setPointerCapture(e.pointerId);Keyboard._keyStates[code].pressed=true;Keyboard._keyStates[code].down=true;};
    button.onpointerup=button.onpointercancel=release;
  });
  const fire=document.getElementById('pool-shoot');fire.onpointerdown=e=>{e.preventDefault();e.stopPropagation();if(!Game.mainMenu.active&&!Game.policy.turnPlayed&&!(AI_ON&&Game.policy.turn===AI_PLAYER_NUM)&&Game.gameWorld.stick.power>0)Game.gameWorld.stick.shoot(Game.gameWorld.stick.power,Game.gameWorld.stick.rotation);};
  const screen=document.getElementById('screen');
  function touchPosition(e){const rect=screen.getBoundingClientRect();Mouse._position=new Vector2((e.clientX-rect.left)/rect.width*1500,(e.clientY-rect.top)/rect.height*825);}
  screen.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();screen.setPointerCapture(e.pointerId);touchPosition(e);if(Game.mainMenu.active||Game.policy?.foul){Mouse._left.pressed=true;Mouse._left.down=true;setTimeout(()=>{Mouse._left.down=false;},100);}});
  screen.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'){e.preventDefault();touchPosition(e);}});
  screen.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')Mouse._left.down=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){Keyboard._keyStates.forEach(k=>k.down=false);Mouse._left.down=false;}});
}
