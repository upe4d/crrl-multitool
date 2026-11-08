// Модель иногда возвращает повреждённый JSON. Извлекаем только явно названный ориентир.
export function parseLandmark(text) {
  if (typeof text !== 'string') throw new Error('Модель не вернула ответ');
  const block = text.match(/\{[^{}]*\}/)?.[0];
  let value = '';
  if (block) {
    try { value = JSON.parse(block).landmark; }
    catch {
      const field = block.match(/"landmark"\s*:\s*("(?:[^"\\]|\\.)*")/);
      if (field) { try { value = JSON.parse(field[1]); } catch {} }
    }
  }
  if (typeof value !== 'string' || value.trim().length < 3 || value.length > 150 || /[\r\n]/.test(value) || value.trim().startsWith('-')) {
    throw new Error('Не удалось распознать ориентир. Попробуйте указать название или город в подсказке.');
  }
  return value.trim();
}
