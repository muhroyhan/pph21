import type { DtpConfig } from './types.js';
import { assertIsoMonthString } from '../utils/validate-date.js';

/**
 * PMK 105/2025 — PPh 21 Ditanggung Pemerintah (DTP) 2026 stimulus for five
 * labor-intensive sectors (133 KBLI codes). Employer pays the withheld tax
 * to the employee as cash instead of remitting it. Eligibility is fixed by
 * the employee's income in the baseline month (January 2026, or first month
 * worked) — later raises above the threshold do not revoke eligibility for
 * the rest of 2026.
 */
export const DTP_2026: DtpConfig = {
  regulation: 'PMK 105/2025',
  eligibleKbliSectors: ['footwear', 'textile', 'furniture', 'leather-goods', 'tourism'],
  maxMonthlyGross: 10_000_000,
  maxDailyWage: 500_000,
  baselineMonth: '2026-01',
};

assertIsoMonthString(DTP_2026.baselineMonth, 'DTP_2026.baselineMonth');
