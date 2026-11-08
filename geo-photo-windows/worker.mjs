import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { assess } from './assess.mjs';
import { nearCandidates } from './near-fallback.mjs';

// Фотография обрабатывается моделью локально; наружу передаются название и координаты ориентира.
const [configFile, photo, runDir] = process.argv.slice(2);
const c = JSON.parse(await readFile(configFile, 'utf8'));
const emit = (stage, extra = {}) => console.log(JSON.stringify({ stage, ...extra }));
const env = { ...process.env, UV_CACHE_DIR: c.uvCache, UV_PYTHON: c.python, HF_HOME: c.hfCache, PYTHONUTF8: '1' };
function run(script, args, timeout = 120000, skill = true) {
  const target = skill ? path.join(c.skillScripts, script) : path.join(c.appDir, script);
  const p = spawnSync(c.uv, ['run', '--offline', '--python', c.python, target, ...args], { encoding: 'utf8', timeout, env, cwd: c.dataDir, maxBuffer: 4 * 1024 * 1024 });
  if (p.error || p.status !== 0) throw new Error(`${script}: ${(p.error?.message || p.stderr || 'ошибка процесса').slice(0, 500)}`);
  return p.stdout;
}
try {
  emit('Читаем метаданные');
  let metadata = null, metadataError = null;
  try { metadata = JSON.parse(run('metadata-check.py', [photo], 30000, false)); } catch (e) { metadataError = e.message; }
  emit('Загружаем модель в память');
  const { AutoProcessor, AutoTokenizer, Qwen2_5_VLForConditionalGeneration, RawImage, env: hf } = await import(pathToFileURL(c.transformers).href);
  hf.cacheDir = c.modelCache; hf.allowRemoteModels = false;
  const id = 'onnx-community/Qwen2.5-VL-3B-Instruct-ONNX';
  const processor = await AutoProcessor.from_pretrained(id, { local_files_only: true });
  const tokenizer = await AutoTokenizer.from_pretrained(id, { local_files_only: true });
  const model = await Qwen2_5_VLForConditionalGeneration.from_pretrained(id, { device: 'cpu', dtype: 'q4', local_files_only: true });
  emit('Распознаём ориентир на фотографии');
  const source = await RawImage.read(photo);
  const scale = Math.min(756 / Math.max(source.width, source.height), 1);
  const dim = n => Math.max(28, Math.round(n * scale / 28) * 28);
  const image = await source.resize(dim(source.width), dim(source.height));
  const prompt = tokenizer.apply_chat_template([{ role: 'user', content: [{ type: 'image' }, { type: 'text', text: 'Name the most recognizable landmark and its city in the image. Respond as JSON only: {"landmark":"name, city"}. If unsure use an empty string.' }] }], { tokenize: false, add_generation_prompt: true });
  const answer = await model.generate({ ...await processor(prompt, image), max_new_tokens: 80, do_sample: false });
  const decoded = tokenizer.batch_decode(answer, { skip_special_tokens: true })[0].split('assistant\n').at(-1);
  const match = decoded.match(/\{[^{}]*\}/);
  if (!match) throw new Error('Модель не смогла сформировать название ориентира');
  const hypothesis = JSON.parse(match[0]).landmark;
  if (typeof hypothesis !== 'string' || hypothesis.length < 3 || hypothesis.length > 150 || /[\r\n]/.test(hypothesis) || hypothesis.startsWith('-')) throw new Error('На фотографии не удалось уверенно распознать ориентир');
  emit('Ищем ориентир на карте', { hypothesis });
  const pois = path.join(runDir, 'poi.json');
  run('poi.py', [hypothesis, '--sources', 'osm', '--limit', '5', '--proxy', 'direct', '--out', pois], 60000);
  const candidates = JSON.parse(await readFile(pois, 'utf8'));
  if (!Object.keys(candidates).length) throw new Error(`На карте не найден ориентир: ${hypothesis}`);
  emit('Сравниваем фотографию с панорамами', { hypothesis });
  let panoramaError = null, rows = [];
  try {
    const output = path.join(runDir, 'panoramas.json');
    const index = path.join(runDir, 'panoramas.index.json');
    run('gsv.py', ['targets', '--points', pois, '--per', '12', '--min-dist', '20', '--max-dist', '400', '--spacing', '35', '--proxy', 'direct', '--out', output], 120000);
    let views = JSON.parse(await readFile(index, 'utf8'));
    if (!views.length) {
      const target = Object.values(candidates)[0];
      const nearest = JSON.parse(run('gsv.py', ['near', target.join(','), '--radius', '400', '--proxy', 'direct'], 90000));
      views = nearCandidates(nearest, target);
      await writeFile(index, JSON.stringify(views));
    }
    if (!views.length) throw new Error('Панорамы рядом с ориентиром не найдены');
    const result = path.join(runDir, 'matches.json');
    run('match.py', ['rank', '--query', photo, '--items', index, '--render', 'gsv', '--max-candidates', '18', '--method', 'dino', '--refine', 'sift', '--top', '18', '--proxy', 'direct', '--out', result], 300000);
    rows = JSON.parse(await readFile(result, 'utf8'));
  } catch (e) { panoramaError = e.message; }
  emit('Готово', { result: { hypothesis, metadata, metadataError, candidates, assessment: assess(rows), panoramaError } });
} catch (e) { emit('Ошибка', { error: e.message }); process.exitCode = 1; }
