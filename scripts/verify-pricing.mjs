// Verifies the pricing logic in src/pages/PublicRentForm.tsx against expected values.
import { BIKE_MODELS, PRICING_RULES } from '../src/config/bike-rates.ts';

function price(modelId, startISO, endISO, outsideArea = false) {
  const model = BIKE_MODELS.find(m => m.id === modelId);
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const effectiveDays = Math.max(1, days);

  let totalLKR;
  let appliedRate = model.dailyRateLKR;

  // === mirror of PublicRentForm.tsx ===
  if (effectiveDays >= 30 && model.monthlyRateLKR > 0) {
    appliedRate = model.monthlyRateLKR / 30;
    totalLKR = appliedRate * effectiveDays;
  } else {
    totalLKR = effectiveDays * model.dailyRateLKR;
    if (effectiveDays > PRICING_RULES.longTermDiscountDays) {
      totalLKR -= totalLKR * PRICING_RULES.longTermDiscountPercentage;
    }
  }
  if (outsideArea) totalLKR += effectiveDays * PRICING_RULES.outsideAreaRateLKR;
  // === end mirror ===

  return { total: Math.round(totalLKR), days: effectiveDays, appliedRate };
}

const cases = [
  ['yamaha-zr', '2026-11-16', '2026-11-19', false, 4500,  'ZR 3 days: no discount (3 is not > 3)'],
  ['yamaha-zr', '2026-11-16', '2026-11-20', false, 5400,  'ZR 4 days: 6000 - 10%'],
  ['yamaha-fz', '2026-11-01', '2026-12-01', false, 30000, 'FZ 30 days: monthly 30000/30*30'],
  ['yamaha-125', '2026-11-01', '2026-12-01', false, 67500,'Yamaha 125 30 days: NO monthly -> daily, was the LKR 0 bug'],
  ['zoom-110', '2026-11-01', '2026-12-01', false, 67500, 'Zoom 110 30 days: NO monthly -> daily, 10% long-stay off'],
  ['tvs-ntorq', '2026-11-16', '2026-11-20', false, 9000,  'Ntorq 4 days: 10000 - 10%'],
  ['yamaha-zr-street-rally', '2026-11-16', '2026-11-17', false, 2000, 'Street Rally 1 day: no discount'],
  ['yamaha-zr', '2026-11-16', '2026-11-19', true, 6000,  'ZR 3 days + outside area: 4500 + 1500'],
];

let pass = 0, fail = 0;
for (const [id, s, e, oa, expected, label] of cases) {
  const r = price(id, s, e, oa);
  const ok = r.total === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}
        got ${r.total} | expected ${expected} (${r.days} days @ ${r.appliedRate}/day)`);
}

console.log(`\n${pass} passed, ${fail} failed`);
console.log('\nDropdown labels:');
for (const m of BIKE_MODELS) {
  console.log(`  ${m.name} - LKR ${m.dailyRateLKR.toLocaleString()}${m.dailyRateMaxLKR && m.dailyRateMaxLKR > m.dailyRateLKR ? ` - LKR ${m.dailyRateMaxLKR.toLocaleString()}` : ''}/day`);
}
process.exit(fail ? 1 : 0);
