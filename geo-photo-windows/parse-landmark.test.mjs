import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLandmark } from './parse-landmark.mjs';

test('читает корректный и частично повреждённый ответ', () => {
  assert.equal(parseLandmark('{"landmark":"Eiffel Tower, Paris"}'), 'Eiffel Tower, Paris');
  assert.equal(parseLandmark('{"landmark":"Eiffel Tower, Paris","city:"}'), 'Eiffel Tower, Paris');
});
test('не выдаёт пустой или отсутствующий ориентир за результат', () => {
  for (const text of ['{"landmark":"","city:"}', '{}', 'нет ответа']) assert.throws(() => parseLandmark(text), /Не удалось распознать/);
});
