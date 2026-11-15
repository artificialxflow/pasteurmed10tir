/**
 * Smoke checks for updates/35/06 tier rules — run: npm run check:loan-tier
 */
import { resolveAllowedTiersForLoan, isTierAllowedForLoan } from '../lib/membership/loan-tier-rules';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exitCode = 1;
  } else {
    console.log('OK:', message);
  }
}

const capCase = resolveAllowedTiersForLoan({ amount: 100_000_000, months: 12 });
assert(
  capCase.includes('regular') && capCase.includes('vip') && capCase.includes('eco-plus'),
  '۱۰۰M / ۱۲ماه → عادی + VIP + اکوپلاس',
);

const highAmount = resolveAllowedTiersForLoan({ amount: 400_000_000, months: 12 });
assert(
  highAmount.length === 1 && highAmount[0] === 'vip',
  '۴۰۰M / ۱۲ماه → فقط VIP',
);

const longTerm = resolveAllowedTiersForLoan({ amount: 100_000_000, months: 24 });
assert(
  longTerm.length === 1 && longTerm[0] === 'vip',
  '۱۰۰M / ۲۴ماه → فقط VIP',
);

assert(
  isTierAllowedForLoan('eco-plus', 100_000_000, 12),
  'اکوپلاس مجاز در محدوده عادی',
);
assert(
  !isTierAllowedForLoan('eco-plus', 400_000_000, 12),
  'اکوپلاس نامجاز بالای سقف عادی',
);

if (process.exitCode !== 1) {
  console.log('\nAll loan-tier checks passed.');
}