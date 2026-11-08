import { distanceMeters } from './assess.mjs';

// Панорамы рядом с объектом — только кандидаты, а не координаты камеры.
export function nearCandidates(result, target, radius = 400, limit = 18) {
  if (!Array.isArray(target) || target.length !== 2 || !target.every(Number.isFinite) ||
      Math.abs(target[0]) > 90 || Math.abs(target[1]) > 180 || !Number.isFinite(radius) || radius <= 0 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError('Некорректные параметры поиска панорам');
  if (!result || typeof result !== 'object') return [];
  const candidates = [{ id: result.id, wgs: result.wgs }, ...(Array.isArray(result.neighbors) ? result.neighbors : [])];
  const seen = new Set();
  const rows = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate.id !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(candidate.id) ||
        /^(CIHM|CIAB|CAoS)/.test(candidate.id) || seen.has(candidate.id) ||
        !Array.isArray(candidate.wgs) || candidate.wgs.length !== 2 || !candidate.wgs.every(Number.isFinite) ||
        Math.abs(candidate.wgs[0]) > 90 || Math.abs(candidate.wgs[1]) > 180) continue;
    const distance = distanceMeters(candidate.wgs, target);
    if (distance > radius || distance < 1) continue;
    const rad = Math.PI / 180;
    const lat1 = candidate.wgs[0] * rad, lat2 = target[0] * rad, lon = (target[1] - candidate.wgs[1]) * rad;
    const heading = (Math.atan2(Math.sin(lon) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon)) / rad + 360) % 360;
    seen.add(candidate.id);
    rows.push({ id: candidate.id, wgs: candidate.wgs, target, heading: Math.round(heading * 10) / 10,
      dist: Math.round(distance), label: `Ближайшая панорама ${Math.round(distance)} м`, selection_band: 'near-fallback' });
    if (rows.length === limit) break;
  }
  return rows;
}
