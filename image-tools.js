(()=>{
'use strict';
const MAX_BYTES=30*1024*1024,MAX_SIDE=8192,MAX_PIXELS=32000000;
const modes={resize:['Размер','Укажите новые размеры изображения.'],crop:['Кадрирование','Укажите положение и размер области в пикселях исходного изображения.'],rotate:['Поворот','Поверните изображение на выбранный угол.'],clean:['Убрать метаданные','Изображение будет пересохранено без исходных метаданных.']};
window.imageToolsList=Object.entries(modes).map(([id,[label]])=>({id,label}));
window.initImageTools=function(){
 const root=document.getElementById('image-tools-root');if(!root||root.dataset.initialized)return;root.dataset.initialized='true';
 root.classList.add('image-tools');root.innerHTML=`
 <div class="image-tabs" role="group" aria-label="Инструменты для изображений">
  <button type="button" data-image-mode="resize">Размер</button><button type="button" data-image-mode="crop">Кадрирование</button><button type="button" data-image-mode="rotate">Поворот</button><button type="button" data-image-mode="clean">Убрать метаданные</button>
 </div>
 <section class="image-panel"><div class="image-heading"><div><span>ОБРАБОТКА В БРАУЗЕРЕ</span><h2 id="image-heading">Размер</h2><p id="image-description"></p></div></div>
 <label class="image-file">Изображение<input id="image-file" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"></label>
 <p id="image-source-info" class="image-hint">PNG, JPEG или WebP, до 30 МБ и 32 млн пикселей</p>
 <div class="image-settings" data-image-settings="resize"><label>Ширина, px<input id="image-width" type="number" min="1" max="8192" step="1" inputmode="numeric"></label><label>Высота, px<input id="image-height" type="number" min="1" max="8192" step="1" inputmode="numeric"></label><label class="image-check"><input id="image-ratio" type="checkbox" checked> Сохранять пропорции</label></div>
 <div class="image-settings" data-image-settings="crop" hidden><label>Слева, px<input id="image-crop-x" type="number" min="0" max="8191" step="1" value="0" inputmode="numeric"></label><label>Сверху, px<input id="image-crop-y" type="number" min="0" max="8191" step="1" value="0" inputmode="numeric"></label><label>Ширина, px<input id="image-crop-width" type="number" min="1" max="8192" step="1" inputmode="numeric"></label><label>Высота, px<input id="image-crop-height" type="number" min="1" max="8192" step="1" inputmode="numeric"></label></div>
 <div class="image-settings" data-image-settings="rotate" hidden><label>Угол<select id="image-angle"><option value="90">90° по часовой</option><option value="180">180°</option><option value="270">90° против часовой</option></select></label></div>
 <div class="image-settings" data-image-settings="clean" hidden><p class="image-hint">При пересохранении метаданные исходного файла не переносятся.</p></div>
 <div class="image-output-settings"><label>Формат результата<select id="image-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label><label id="image-quality-label" hidden>Качество, %<input id="image-quality" type="number" min="1" max="100" value="90" step="1" inputmode="numeric"></label></div>
 <div class="image-actions"><button id="image-apply" class="image-primary" type="button" disabled>Обработать</button><a id="image-download" class="image-download" hidden>Скачать изображение</a></div><p id="image-status" class="image-status" role="status" aria-live="polite"></p>
 <div class="image-previews"><figure id="image-before" hidden><figcaption>Исходное изображение</figcaption><img id="image-source-preview" alt="Исходное изображение"></figure><figure id="image-after" hidden><figcaption>Результат <span id="image-result-info"></span></figcaption><img id="image-result-preview" alt="Обработанное изображение"></figure></div>
 </section>`;
 const $=s=>root.querySelector(s),file=$('#image-file'),status=$('#image-status'),apply=$('#image-apply'),download=$('#image-download'),format=$('#image-format'),quality=$('#image-quality');
 const width=$('#image-width'),height=$('#image-height'),ratio=$('#image-ratio'),cropX=$('#image-crop-x'),cropY=$('#image-crop-y'),cropW=$('#image-crop-width'),cropH=$('#image-crop-height'),angle=$('#image-angle');
 let mode='resize',source=null,sourceUrl='',resultUrl='',loadId=0,revision=0,busy=false;
 function revoke(url){if(url)URL.revokeObjectURL(url)}
 function clearResult(){revoke(resultUrl);resultUrl='';download.hidden=true;download.removeAttribute('href');$('#image-after').hidden=true;$('#image-result-preview').removeAttribute('src');$('#image-result-info').textContent=''}
 function changed(){revision++;clearResult();status.textContent=''}
 function selectMode(next){if(!modes[next])return;mode=next;for(const button of root.querySelectorAll('[data-image-mode]'))button.setAttribute('aria-pressed',String(button.dataset.imageMode===next));for(const section of root.querySelectorAll('[data-image-settings]'))section.hidden=section.dataset.imageSettings!==next;$('#image-heading').textContent=modes[next][0];$('#image-description').textContent=modes[next][1];changed();document.dispatchEvent(new CustomEvent('image-tool-change',{detail:{tool:next}}))}
 function integer(el,name,min,max){const value=Number(el.value);if(!el.value.trim()||!Number.isInteger(value)||value<min||value>max)throw Error(name+': укажите целое число от '+min+' до '+max);return value}
 function validateSize(w,h){if(w<1||h<1||w>MAX_SIDE||h>MAX_SIDE||w*h>MAX_PIXELS)throw Error('Размер результата — не более 8192 px по стороне и 32 млн пикселей')}
 file.addEventListener('change',()=>{
  const token=++loadId;changed();source=null;revoke(sourceUrl);sourceUrl='';$('#image-before').hidden=true;$('#image-source-preview').removeAttribute('src');apply.disabled=true;
  const picked=file.files?.[0];if(!picked){$('#image-source-info').textContent='Выберите PNG, JPEG или WebP';return}
  if(picked.size>MAX_BYTES){status.textContent='Файл больше 30 МБ';return}
  if(!/\.(?:png|jpe?g|webp)$/i.test(picked.name)&&!['image/png','image/jpeg','image/webp'].includes(picked.type)){status.textContent='Поддерживаются PNG, JPEG и WebP';return}
  const candidate=URL.createObjectURL(picked),image=new Image();image.onload=()=>{if(token!==loadId){revoke(candidate);return}try{validateSize(image.naturalWidth,image.naturalHeight)}catch(error){revoke(candidate);status.textContent='Исходное изображение: '+error.message;return}source={image,width:image.naturalWidth,height:image.naturalHeight,name:picked.name};sourceUrl=candidate;width.value=String(source.width);height.value=String(source.height);cropX.value='0';cropY.value='0';cropW.value=String(source.width);cropH.value=String(source.height);format.value=({ 'image/jpeg':'image/jpeg','image/webp':'image/webp' })[picked.type]||'image/png';$('#image-quality-label').hidden=format.value==='image/png';$('#image-source-info').textContent=source.name+' · '+source.width+' × '+source.height+' px';$('#image-source-preview').src=sourceUrl;$('#image-before').hidden=false;apply.disabled=busy;status.textContent='Изображение готово к обработке'};image.onerror=()=>{revoke(candidate);if(token===loadId)status.textContent='Не удалось открыть изображение. Выберите корректный файл PNG, JPEG или WebP'};image.src=candidate;
 });
 width.addEventListener('input',()=>{if(source&&ratio.checked&&Number(width.value)>0)height.value=String(Math.max(1,Math.round(Number(width.value)*source.height/source.width)))});
 height.addEventListener('input',()=>{if(source&&ratio.checked&&Number(height.value)>0)width.value=String(Math.max(1,Math.round(Number(height.value)*source.width/source.height)))});
 ratio.addEventListener('change',()=>{if(source&&ratio.checked&&Number(width.value)>0)height.value=String(Math.max(1,Math.round(Number(width.value)*source.height/source.width)))});
 for(const control of [width,height,ratio,cropX,cropY,cropW,cropH,angle,format,quality])control.addEventListener('input',changed);
 format.addEventListener('change',()=>{$('#image-quality-label').hidden=format.value==='image/png';changed()});
 for(const button of root.querySelectorAll('[data-image-mode]'))button.addEventListener('click',()=>selectMode(button.dataset.imageMode));
 apply.addEventListener('click',async()=>{
  if(!source||busy)return;const current=source,token=revision;busy=true;apply.disabled=true;status.textContent='Обрабатываем изображение…';clearResult();
  try{let sx=0,sy=0,sw=current.width,sh=current.height,w=sw,h=sh,turn=0;
   if(mode==='resize'){w=integer(width,'Ширина',1,MAX_SIDE);h=integer(height,'Высота',1,MAX_SIDE)}
   if(mode==='crop'){sx=integer(cropX,'Слева',0,current.width-1);sy=integer(cropY,'Сверху',0,current.height-1);sw=integer(cropW,'Ширина',1,current.width);sh=integer(cropH,'Высота',1,current.height);if(sx+sw>current.width||sy+sh>current.height)throw Error('Область выходит за границы изображения');w=sw;h=sh}
   if(mode==='rotate'){turn=integer(angle,'Угол',90,270);if(![90,180,270].includes(turn))throw Error('Выберите угол поворота');if(turn===90||turn===270){w=current.height;h=current.width}}
   validateSize(w,h);const mime=format.value;if(!['image/png','image/jpeg','image/webp'].includes(mime))throw Error('Выберите поддерживаемый формат');const q=mime==='image/png'?undefined:integer(quality,'Качество',1,100)/100;
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Браузер не смог создать изображение');if(mime==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}
   if(turn){ctx.translate(w/2,h/2);ctx.rotate(turn*Math.PI/180);ctx.drawImage(current.image,-current.width/2,-current.height/2)}else ctx.drawImage(current.image,sx,sy,sw,sh,0,0,w,h);
   const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Браузер не смог сохранить изображение')),mime,q));if(blob.type!==mime)throw Error('Этот формат не поддерживается браузером');if(token!==revision||current!==source)return;
   resultUrl=URL.createObjectURL(blob);$('#image-result-preview').src=resultUrl;$('#image-result-info').textContent='· '+w+' × '+h+' px';$('#image-after').hidden=false;download.href=resultUrl;download.download=(current.name.replace(/\.[^.]+$/,'')||'image')+'-'+mode+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'})[mime];download.hidden=false;status.textContent='Готово — результат можно скачать';
  }catch(error){if(token===revision)status.textContent='Не удалось обработать: '+error.message}finally{busy=false;apply.disabled=!source}
 });
 window.addEventListener('beforeunload',()=>{revoke(sourceUrl);revoke(resultUrl)});selectMode('resize');
};
window.imageToolsSelect=function(id){if(!Object.hasOwn(modes,id))return;window.initImageTools();const root=document.getElementById('image-tools-root');root?.querySelector('[data-image-mode="'+id+'"]')?.click()};
})();
