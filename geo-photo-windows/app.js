const $ = selector => document.querySelector(selector);
const token = $('meta[name="app-token"]').content;
const file = $('#file'), upload = $('.upload'), button = $('#run'), status = $('#status');
let selected = null, previewUrl = null, timer = null;
const headers = { 'X-App-Token': token };
function setFile(value) {
  if (!value || !['image/jpeg', 'image/png'].includes(value.type) || value.size > 12 * 1024 * 1024) { status.textContent = 'Выберите JPG или PNG размером до 12 МиБ'; selected = null; button.disabled = true; return; }
  selected = value; button.disabled = false; $('#file-title').textContent = value.name; $('#file-hint').textContent = `${(value.size / 1048576).toFixed(1)} МиБ · нажмите, чтобы заменить`;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(value); $('#preview').src = previewUrl; $('#preview-wrap').hidden = false; status.textContent = 'Готово к поиску';
}
file.addEventListener('change', () => setFile(file.files[0]));
for (const type of ['dragenter', 'dragover']) upload.addEventListener(type, e => { e.preventDefault(); upload.classList.add('drag'); });
for (const type of ['dragleave', 'drop']) upload.addEventListener(type, e => { e.preventDefault(); upload.classList.remove('drag'); });
upload.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));
function card(title) { const node = document.createElement('article'); node.className = 'result-card'; const h = document.createElement('h3'); h.textContent = title; node.append(h); return node; }
function line(parent, text) { const p = document.createElement('p'); p.textContent = text; parent.append(p); }
function link(parent, label, url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label + ' ↗'; parent.append(a); }
function showResult(r) {
  const result = $('#results-content'); result.replaceChildren(); $('#results').hidden = false;
  const guess = card(r.suppliedHint ? 'Ваша подсказка' : 'Ориентир по версии модели'); line(guess, r.hypothesis); line(guess, r.suppliedHint ? 'Название предоставлено вами и требует проверки.' : 'Это предположение: модель может ошибиться.'); result.append(guess);
  const gps = card('Метаданные снимка');
  if (r.metadata?.coordinates) { const { latitude, longitude } = r.metadata.coordinates; line(gps, `GPS: ${latitude}, ${longitude}`); link(gps, 'Открыть на карте', `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`); }
  else line(gps, r.metadataError ? 'Не удалось прочитать метаданные' : 'GPS-координаты не найдены');
  if (r.metadata?.direction) line(gps, `Направление EXIF: ${r.metadata.direction.degrees}° · ${r.metadata.direction.reference}`);
  line(gps, 'Метаданные могут быть изменены.'); result.append(gps);
  for (const [name, coords] of Object.entries(r.candidates)) { if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite)) continue; const p = card('Ориентир на OpenStreetMap'); line(p, name); line(p, `${coords[0]}, ${coords[1]}`); link(p, 'Открыть карту', `https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}#map=17/${coords[0]}/${coords[1]}`); result.append(p); }
  const panos = r.assessment?.candidate_positions || [];
  if (!panos.length) { const p = card('Панорамы'); line(p, r.panoramaError || 'Подходящие панорамы не найдены'); result.append(p); }
  panos.forEach((p, i) => { const el = card(`Вариант панорамы ${i + 1}`); line(el, `${p.wgs[0].toFixed(6)}, ${p.wgs[1].toFixed(6)}`); line(el, `Совпадений деталей: ${p.inliers} · точка не подтверждена`); const heading = Number.isFinite(p.heading) ? `&heading=${p.heading}` : ''; link(el, 'Сравнить на карте', `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.wgs[0]},${p.wgs[1]}${heading}`); result.append(el); });
}
async function poll() {
  try { const response = await fetch('/api/status', { headers }); const state = await response.json(); if (!response.ok) throw new Error(state.error); status.textContent = state.stage + (state.hypothesis ? ` · ${state.hypothesis}` : ''); if (state.running) { timer = setTimeout(poll, 1500); return; } button.disabled = !selected; if (state.error) status.textContent = `Ошибка: ${state.error}`; if (state.result) showResult(state.result); }
  catch (error) { status.textContent = `Нет связи с приложением: ${error.message}`; button.disabled = !selected; }
}
button.addEventListener('click', async () => {
  if (!selected) return; button.disabled = true; $('#results').hidden = true; status.textContent = 'Подготавливаем изображение';
  try { const encoded = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(new Error('Не удалось прочитать файл')); reader.readAsDataURL(selected); });
    const response = await fetch('/api/run', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ image: encoded, hint: $('#hint').value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); clearTimeout(timer); poll();
  } catch (error) { status.textContent = `Ошибка: ${error.message}`; button.disabled = false; }
});
poll();
