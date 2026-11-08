// Схожие панорамы показываем как варианты, а не как доказанную точку съёмки.
const radians = value => value * Math.PI / 180;
export function distanceMeters(a, b) {
  const dLat = radians(b[0] - a[0]);
  const dLon = radians(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
// Сопоставление разных фрагментов служит проверкой согласованности, а не подтверждением места.
export function compareViews(wholeRows, cropRows) {
  const valid = row => row && Array.isArray(row.wgs) && row.wgs.length === 2 && row.wgs.every(Number.isFinite)
    && Math.abs(row.wgs[0]) <= 90 && Math.abs(row.wgs[1]) <= 180 && Number.isFinite(row.heading);
  const a = Array.isArray(wholeRows) ? wholeRows.find(valid) : null;
  const b = Array.isArray(cropRows) ? cropRows.find(valid) : null;
  if (!a || !b) return { status: 'недостаточно данных', distance_m: null, heading_difference: null };
  const distance = distanceMeters(a.wgs, b.wgs);
  const heading = Math.abs(((a.heading - b.heading + 540) % 360) - 180);
  return { status: distance > 50 || heading > 30 ? 'кандидаты расходятся' : 'кандидаты согласуются, но не подтверждены',
    distance_m: Math.round(distance * 10) / 10, heading_difference: Math.round(heading * 10) / 10 };
}
export function assess(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Ожидался список панорам');
  const usable = rows.filter(row => Array.isArray(row.wgs) && row.wgs.length === 2 && row.wgs.every(Number.isFinite) && Math.abs(row.wgs[0]) <= 90 && Math.abs(row.wgs[1]) <= 180 && Number.isFinite(row.inliers));
  const first = usable[0];
  // Множество ракурсов одной панорамы не является множеством независимых мест.
  const key = row => typeof row.id === 'string' && row.id ? row.id : row.wgs.join(',');
  const byPanorama = new Map();
  for (const row of usable) {
    const id = key(row);
    if (!byPanorama.has(id)) byPanorama.set(id, row);
  }
  const positions = [...byPanorama.values()];
  const conflicting = first ? positions.slice(1).filter(row => {
    if (row.inliers < 8) return false;
    const delta = Number.isFinite(first.heading) && Number.isFinite(row.heading) ? Math.abs(((first.heading - row.heading + 540) % 360) - 180) : null;
    return distanceMeters(first.wgs, row.wgs) > 75 || (delta !== null && delta > 40);
  }) : [];
  return {
    state: 'не подтверждено',
    weak_match: !first || first.inliers < 15,
    conflicting_candidates: conflicting.length,
    unique_panoramas: positions.length,
    candidate_positions: positions.slice(0, 5).map(row => ({ id: row.id ?? null, wgs: row.wgs, heading: row.heading ?? null, inliers: row.inliers })),
    reason: 'Сходство с панорамой не подтверждает координаты и направление камеры. Требуются независимые признаки.',
  };
}
