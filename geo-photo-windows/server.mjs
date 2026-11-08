import http from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const resolve = (value, fallback) => path.resolve(appDir, value || fallback);
let settings = {};
try { settings = JSON.parse(await readFile(path.join(appDir, 'config.local.json'), 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const c = {
  appDir, dataDir: resolve(settings.dataDir, '../../geo-sleuth-build/desktop-data'),
  modelCache: resolve(settings.modelCache, '../../geo-sleuth-build/model-cache'),
  hfCache: resolve(settings.hfCache, '../../geo-sleuth-build/hf-cache'),
  uvCache: resolve(settings.uvCache, '../../geo-sleuth-build/uv-cache'),
  transformers: resolve(settings.transformers, '../../browserytools-static-lab/node_modules/@huggingface/transformers/dist/transformers.node.mjs'),
  skillScripts: path.resolve(settings.skillScripts || path.join(os.homedir(), '.codex/skills/geo-sleuth/scripts')),
  python: settings.python || 'C:/Python313/python.exe', uv: settings.uv || 'uv',
};
await mkdir(c.dataDir, { recursive: true });
const token = randomBytes(24).toString('hex');
let active = null, last = { stage: 'Ожидаем фотографию' };
const app = await readFile(path.join(appDir, 'index.html'), 'utf8');
const assets = { '/style.css': ['style.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };
const send = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    if (req.headers.host !== `127.0.0.1:${server.address().port}`) return send(res, 403, { error: 'Недопустимый адрес' });
    if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" }); return res.end(app.replace('__TOKEN__', token)); }
    if (req.method === 'GET' && assets[req.url]) { const [file, type] = assets[req.url]; res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); return res.end(await readFile(path.join(appDir, file))); }
    if (!req.url.startsWith('/api/') || (req.headers.origin && req.headers.origin !== origin) || (req.method === 'POST' && req.headers.origin !== origin) || req.headers['x-app-token'] !== token) return send(res, 403, { error: 'Доступ отклонён' });
    if (req.method === 'GET' && req.url === '/api/status') return send(res, 200, { ...last, running: !!active });
    if (req.method !== 'POST' || req.url !== '/api/run') return send(res, 404, { error: 'Страница не найдена' });
    if (active) return send(res, 409, { error: 'Дождитесь завершения текущего поиска' });
    const parts = []; let size = 0;
    for await (const part of req) { size += part.length; if (size > 17 * 1024 * 1024) return send(res, 413, { error: 'Файл слишком большой: максимум 12 МиБ' }); parts.push(part); }
    const body = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (typeof body.image !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.image)) return send(res, 400, { error: 'Не удалось прочитать изображение' });
    const bytes = Buffer.from(body.image, 'base64');
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if ((!jpeg && !png) || bytes.length > 12 * 1024 * 1024) return send(res, 400, { error: 'Выберите изображение JPG или PNG размером до 12 МиБ' });
    for (const required of [c.transformers, c.python, path.join(c.skillScripts, 'match.py'), path.join(c.modelCache, 'onnx-community/Qwen2.5-VL-3B-Instruct-ONNX/onnx/decoder_model_merged_q4.onnx_data')]) await stat(required);
    const dir = path.join(c.dataDir, randomUUID()); await mkdir(dir);
    const photo = path.join(dir, jpeg ? 'photo.jpg' : 'photo.png');
    await writeFile(photo, bytes, { flag: 'wx' });
    const conf = path.join(dir, 'runtime.json'); await writeFile(conf, JSON.stringify(c));
    last = { stage: 'Запускаем обработку' };
    active = spawn(process.execPath, [path.join(appDir, 'worker.mjs'), conf, photo, dir], { cwd: c.dataDir, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let pending = '', err = '';
    active.stdout.on('data', chunk => { pending += chunk.toString(); const lines = pending.split('\n'); pending = lines.pop(); for (const line of lines) { try { const obj = JSON.parse(line); if (obj.stage) last = obj; } catch {} } });
    active.stderr.on('data', chunk => { err = (err + chunk.toString()).slice(-3000); });
    active.on('error', e => { last = { stage: 'Ошибка', error: e.message }; active = null; });
    active.on('close', code => { if (code && !last.error) last = { stage: 'Ошибка', error: `Обработка прервалась (код ${code}). ${err.slice(-500)}` }; active = null; });
    return send(res, 202, { ok: true });
  } catch (error) { send(res, 500, { error: error.code === 'ENOENT' ? `Не найден файл зависимости: ${error.path}` : error.message }); }
});
server.listen(0, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`Приложение запущено: ${url}\nЧтобы остановить, закройте это окно.`);
  if (process.platform === 'win32' && !process.env.GEO_DESKTOP) { const open = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, windowsHide: true, stdio: 'ignore' }); open.unref(); }
});
