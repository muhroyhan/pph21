import type { Bracket } from './types.js';

/**
 * PP 68/2009 — final PPh 21 on pesangon (severance) paid in a lump sum.
 * Brackets apply to the *cumulative* pesangon received within 2 tax years.
 */
export const PESANGON_BRACKETS_2024: Bracket[] = [
  { min: 0, max: 50_000_000, rate: 0.0 },
  { min: 50_000_001, max: 100_000_000, rate: 0.05 },
  { min: 100_000_001, max: 500_000_000, rate: 0.15 },
  { min: 500_000_001, max: null, rate: 0.25 },
];

/**
 * PP 68/2009 — final PPh 21 on JHT/JP (Jaminan Hari Tua / Jaminan Pensiun)
 * lump-sum withdrawals paid at once.
 */
export const JHT_JP_LUMP_SUM_BRACKETS_2024: Bracket[] = [
  { min: 0, max: 50_000_000, rate: 0.0 },
  { min: 50_000_001, max: null, rate: 0.05 },
];
