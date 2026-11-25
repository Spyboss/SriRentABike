// Ensures the frontend default (src/config/bike-rates.ts) and backend default
// (api/src/routes/settings.ts) stay in sync. They are maintained separately and
// can silently drift.
import { readFileSync } from 'node:fs';

const fe = readFileSync(new URL('../src/config/bike-rates.ts', import.meta.url), 'utf8');
const be = readFileSync(new URL('../api/src/routes/settings.ts', import.meta.url), 'utf8');

// Pull every "id: '...'" ... block out of each models array.
function extract(src) {
  const models = [];
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*dailyRateLKR:\s*(\d+),\s*dailyRateMaxLKR:\s*(\d+),\s*monthlyRateLKR:\s*(\d+)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    models.push({
      id: m[1], name: m[2],
      dailyRateLKR: Number(m[3]),
      dailyRateMaxLKR: Number(m[4]),
      monthlyRateLKR: Number(m[5]),
    });
  }
  return models;
}

const a = extract(fe);
const b = extract(be);

const key = m => `${m.id}|${m.name}|${m.dailyRateLKR}|${m.dailyRateMaxLKR}|${m.monthlyRateLKR}`;
const setA = new Set(a.map(key));
const setB = new Set(b.map(key));

let ok = true;
if (a.length !== 7) { console.log(`FAIL frontend has ${a.length} models, expected 7`); ok = false; }
if (b.length !== 7) { console.log(`FAIL backend has ${b.length} models, expected 7`); ok = false; }
for (const k of setA) if (!setB.has(k)) { console.log(`FAIL only in frontend: ${k}`); ok = false; }
for (const k of setB) if (!setA.has(k)) { console.log(`FAIL only in backend:  ${k}`); ok = false; }

console.log(ok ? 'PASS  frontend and backend defaults are identical' : 'FAIL  defaults have drifted');
console.log('\nModel list:');
for (const m of a) {
  console.log(`  ${m.id.padEnd(26)} ${String(m.dailyRateLKR).padStart(5)}-${String(m.dailyRateMaxLKR).padEnd(5)} monthly ${m.monthlyRateLKR}`);
}

// Sanity: no monthly rate should be negative, and max must exceed min.
for (const m of a) {
  if (m.monthlyRateLKR < 0) { console.log(`FAIL negative monthly: ${m.id}`); ok = false; }
  // Equal is fine: a flat rate (max == min) is a legitimate price, as with
  // Zoom 110cc at LKR 2,500. Only an inverted range is a bug.
  if (m.dailyRateMaxLKR < m.dailyRateLKR) { console.log(`FAIL max < min: ${m.id}`); ok = false; }
  if (m.dailyRateLKR <= 0) { console.log(`FAIL non-positive daily: ${m.id}`); ok = false; }
}
process.exit(ok ? 0 : 1);
