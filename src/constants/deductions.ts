import type { DeductionsConfig } from './types.js';

/**
 * Biaya jabatan: PMK 250/PMK.03/2008 (folded into PMK 168/2023 Pasal 11).
 * Biaya pensiun: same regulation, half the rate and cap of biaya jabatan.
 * Both unchanged since 2008; still current as of 2026.
 */
export const DEDUCTIONS_2024: DeductionsConfig = {
  biayaJabatanRate: 0.05,
  biayaJabatanMonthlyCap: 500_000,
  biayaJabatanYearlyCap: 6_000_000,
  biayaPensiunRate: 0.05,
  biayaPensiunMonthlyCap: 200_000,
  biayaPensiunYearlyCap: 2_400_000,
};
