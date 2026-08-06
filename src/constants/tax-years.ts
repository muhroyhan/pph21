import type { TaxYearConfig } from './types.js';
import { PTKP_2024_BASE } from './ptkp.js';
import { ARTICLE17_BRACKETS_2024 } from './article17.js';
import { TER_A_2024, TER_B_2024, TER_C_2024, TER_HARIAN_2024 } from './ter.js';
import { DEDUCTIONS_2024 } from './deductions.js';
import { BPJS_2024 } from './bpjs.js';
import { PESANGON_BRACKETS_2024, JHT_JP_LUMP_SUM_BRACKETS_2024 } from './final-tax.js';
import { DTP_2026 } from './dtp.js';

/**
 * ============================================================================
 *  POLICY CHANGE ENTRY POINT
 * ============================================================================
 * When Indonesian tax regulation changes (new PTKP, new TER tables, a new
 * Article 17 bracket, a new BPJS ceiling, etc.), this is the ONLY file that
 * needs a new entry. Never mutate an existing year's config in place — copy
 * it forward so old payroll runs stay reproducible against the year's
 * original figures. See CONSTANTS.md for the full walkthrough.
 * ============================================================================
 */

const BASE_2024: Omit<TaxYearConfig, 'year' | 'dtp'> = {
  ptkp: PTKP_2024_BASE,
  article17: ARTICLE17_BRACKETS_2024,
  ter: { A: TER_A_2024, B: TER_B_2024, C: TER_C_2024, harian: TER_HARIAN_2024 },
  deductions: DEDUCTIONS_2024,
  bpjs: BPJS_2024,
  finalTax: {
    pesangon: PESANGON_BRACKETS_2024,
    jhtJpLumpSum: JHT_JP_LUMP_SUM_BRACKETS_2024,
  },
  npwpSurchargeMultiplier: 1.2,
  regulations: {
    ptkp: 'PMK 101/PMK.010/2016',
    article17: 'UU HPP 7/2021 Pasal 17 ayat (1) huruf a',
    ter: 'PP 58/2023 & PMK 168/2023',
    finalTax: 'PP 68/2009',
    bpjs: 'PP 44/2015, PP 82/2019 (BPJS Ketenagakerjaan); Perpres 63/2022 (BPJS Kesehatan)',
  },
};

export const TAX_YEAR_CONFIGS: Record<number, TaxYearConfig> = {
  2024: { year: 2024, ...BASE_2024 },
  2025: { year: 2025, ...BASE_2024 },
  2026: {
    year: 2026,
    ...BASE_2024,
    dtp: DTP_2026,
    regulations: { ...BASE_2024.regulations, dtp: 'PMK 105/2025' },
  },
};

export const LATEST_TAX_YEAR = 2026;

export function getTaxYearConfig(year: number = LATEST_TAX_YEAR): TaxYearConfig {
  const config = TAX_YEAR_CONFIGS[year];
  if (!config) {
    const available = Object.keys(TAX_YEAR_CONFIGS).join(', ');
    throw new Error(
      `No tax configuration for year ${year}. Available years: ${available}. ` +
        `Add one in src/constants/tax-years.ts if this is a real policy year.`,
    );
  }
  return config;
}
