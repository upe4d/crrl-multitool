const file = document.querySelector('#image');
function clock(element, expiry, onExpire) {
  const update = () => { const left = Math.max(0, Math.ceil(expiry - Date.now() / 1000)); element.textContent = left ? `Ссылка действует ещё ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'Срок ссылки истёк'; if (!left) { clearInterval(timer); onExpire?.(); } };
  const timer = setInterval(update, 1000); update();
}
const viewerTimer = document.querySelector('[data-expiry]');
if (viewerTimer) clock(viewerTimer, Number(viewerTimer.dataset.expiry), () => { const image = document.querySelector('.shared'); if (image) { image.removeAttribute('src'); image.alt = 'Срок ссылки истёк'; } const download = document.querySelector('a[download]'); if (download) download.hidden = true; });
if (file) {
  const form = document.querySelector('#upload'), status = document.querySelector('#status'), submit = document.querySelector('#submit');
  file.addEventListener('change', () => { document.querySelector('#filename').textContent = file.files[0]?.name || 'Выберите изображение'; });
  form.addEventListener('submit', event => {
    event.preventDefault(); const chosen = file.files[0];
    if (!chosen || chosen.size > 50 * 1024 * 1024) { status.textContent = 'Выберите изображение до 50 МиБ'; return; }
    submit.disabled = true; status.textContent = 'Загружаем изображение…';
    const request = new XMLHttpRequest(); request.open('POST', './'); request.responseType = 'json';
    request.upload.onprogress = event => { if (event.lengthComputable) status.textContent = `Загружено ${Math.round(event.loaded / event.total * 100)}%`; };
    request.onerror = () => { status.textContent = 'Не удалось связаться с сервером'; submit.disabled = false; };
    request.onload = () => {
      const data = request.response;
      if (request.status !== 201 || !data?.id) { status.textContent = data?.error || 'Не удалось загрузить изображение'; submit.disabled = false; return; }
      const url = new URL('./', window.location.href); url.search = new URLSearchParams({ id: data.id });
      document.querySelector('#link').value = url.href; form.hidden = true; document.querySelector('#result').hidden = false;
      clock(document.querySelector('#countdown'), Number(data.expires));
    };
    const payload = new FormData(); payload.append('image', chosen); request.send(payload);
  });
  document.querySelector('#copy').addEventListener('click', async () => { const input = document.querySelector('#link'); try { await navigator.clipboard.writeText(input.value); document.querySelector('#copy').textContent = 'Скопировано'; } catch { input.focus(); input.select(); } });
}
