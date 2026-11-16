/* Локальный запуск Python в отдельном процессе браузера без доступа к сайту. */
(() => {
  const files = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
  let assets;
  const workerSource = `
    self.onmessage = async ({data}) => {
      const urls = {};
      for (const [name, bytes] of Object.entries(data.assets)) {
        urls[name] = URL.createObjectURL(new Blob([bytes], {type: name.endsWith('.wasm') ? 'application/wasm' : 'application/javascript'}));
      }
      const originalImport = self.importScripts.bind(self);
      const originalFetch = self.fetch.bind(self);
      const mapped = (url) => urls[String(url).split('/').pop().split('?')[0]] || String(url);
      self.importScripts = (...urls) => originalImport(...urls.map(mapped));
      self.fetch = (url, options) => originalFetch(mapped(url), options);
      try {
        originalImport(urls['pyodide.js']);
        const lock = JSON.parse(new TextDecoder().decode(data.assets['pyodide-lock.json']));
        const python = await loadPyodide({indexURL:'https://runtime.invalid/', stdLibURL:urls['python_stdlib.zip'], lockFileContents:lock, jsglobals:{}});
        self.postMessage({type:'ready'});
        python.setStdout({batched: s => self.postMessage({type:'output',text:s+'\\n'})});
        python.setStderr({batched: s => self.postMessage({type:'output',text:s+'\\n'})});
        await python.runPythonAsync(data.code);
        self.postMessage({type:'done'});
      } catch(error) { self.postMessage({type:'error',text:String(error)}); }
    };`;
  const frameSource = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src blob:; connect-src blob:"><script>
    onmessage = ({data}) => {
      const worker = new Worker(URL.createObjectURL(new Blob([data.worker],{type:'text/javascript'})));
      worker.onmessage = event => parent.postMessage(event.data,'*');
      worker.onerror = event => parent.postMessage({type:'error',text:event.message},'*');
      worker.postMessage({assets:data.assets,code:data.code});
    };
  <\/script>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'mt-runner';
  dialog.innerHTML = '<div class="mt-runner-head"><div><strong>Запуск Python</strong><p>Код выполняется в вашем браузере, в изолированной среде.</p></div><button type="button" data-close aria-label="Закрыть">×</button></div><label>Код<textarea spellcheck="false" aria-label="Код Python"></textarea></label><div class="mt-runner-actions"><button type="button" data-run>Запустить</button><span role="status" data-status></span></div><label>Результат<pre data-output></pre></label><p class="mt-runner-hint">Поддерживается стандартная библиотека Python. Внешние пакеты и доступ к сети недоступны. <a href="https://github.com/pyodide/pyodide/tree/0.28.3" target="_blank" rel="noopener noreferrer">Pyodide 0.28.3 / MPL-2.0</a></p>';
  document.body.append(dialog);
  const editor = dialog.querySelector('textarea');
  const output = dialog.querySelector('[data-output]');
  const status = dialog.querySelector('[data-status]');
  const run = dialog.querySelector('[data-run]');
  let frame, timer, generation=0;
  function stop() { generation++; clearTimeout(timer); if(frame){frame.remove();frame=null} run.disabled=false; }
  dialog.addEventListener('close', stop);
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  window.addEventListener('message', event => {
    if(!frame || event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    const {type,text} = event.data;
    if(type==='ready') { status.textContent='Выполняется…'; clearTimeout(timer); timer=setTimeout(()=>{status.textContent='Остановлено: превышено время выполнения.';stop()},5000); }
    if(type==='output' && typeof text==='string') output.textContent = (output.textContent+text).slice(0,65536);
    if(type==='error') { output.textContent += '\n'+String(text).slice(0,4096);status.textContent='Ошибка выполнения';stop(); }
    if(type==='done') {status.textContent='Готово';stop()}
  });
  run.addEventListener('click', async () => {
    stop(); const current= generation; run.disabled=true; output.textContent=''; status.textContent='Загружается Python…';
    try {
      assets ||= Promise.all(files.map(async name => {const response=await fetch('/reference/runner/'+name);if(!response.ok)throw Error('Не удалось загрузить '+name);return [name,await response.arrayBuffer()]})).then(Object.fromEntries);
      const data=await assets;
      if(!dialog.open || current!==generation)return;
      frame=document.createElement('iframe'); frame.hidden=true; frame.sandbox='allow-scripts'; frame.srcdoc=frameSource;
      frame.onload=()=>frame.contentWindow.postMessage({worker:workerSource,assets:data,code:editor.value},'*');
      document.body.append(frame);
      timer=setTimeout(()=>{status.textContent='Не удалось запустить Python за 30 секунд.';stop()},30000);
    } catch(error) {assets=null;status.textContent='Ошибка загрузки';output.textContent=String(error);stop()}
  });
  document.addEventListener('click', event => {
    const button=event.target.closest('button');
    const pre=button && button.closest('pre');
    const code=pre && pre.querySelector('code.language-python');
    if(!code || !button.className.includes('from-purple-500'))return;
    event.preventDefault();event.stopImmediatePropagation();
    const raw=code.textContent;
    // В сеансе Python строки без приглашения являются выводом, а не кодом.
    editor.value=/^\s*>>> /m.test(raw)?raw.split('\n').map(line=>/^\s*(>>>|\.\.\.) ?/.test(line)?line.replace(/^\s*(>>>|\.\.\.) ?/,''):'# '+line).join('\n'):raw;
    output.textContent='';status.textContent='';dialog.showModal();
  },true);
  for(const code of document.querySelectorAll('pre > code.language-python')) {
    const pre=code.parentElement;
    if(pre.querySelector('button.from-purple-500'))continue;
    const button=document.createElement('button');button.type='button';
    button.className='from-purple-500 mt-python-run';button.title='Запустить Python';button.setAttribute('aria-label','Запустить Python');button.textContent='▶';
    pre.style.position='relative';pre.insertBefore(button,code);
  }
})();
