import { getTaxYearConfig, TAX_YEAR_CONFIGS, LATEST_TAX_YEAR } from './constants/tax-years.js';
import type { PPh21Result } from './core/result-types.js';

import { calculatePegawaiTetap, type PegawaiTetapInput } from './calculators/pegawai-tetap.js';
import {
  calculatePegawaiTidakTetap,
  type PegawaiTidakTetapInput,
} from './calculators/pegawai-tidak-tetap.js';
import { calculateBukanPegawai, type BukanPegawaiInput } from './calculators/bukan-pegawai.js';
import { calculatePesertaKegiatan, type PesertaKegiatanInput } from './calculators/peserta-kegiatan.js';
import { calculateDewanKomisaris, type DewanKomisarisInput } from './calculators/dewan-komisaris.js';
import { calculateMantanPegawai, type MantanPegawaiInput } from './calculators/mantan-pegawai.js';
import {
  calculatePensiunanBerkala,
  calculatePenarikanDanaPensiunAwal,
  type PensiunanBerkalaInput,
  type PenarikanDanaPensiunAwalInput,
} from './calculators/pensiunan-berkala.js';
import { calculatePenghasilanFinal, type PenghasilanFinalInput } from './calculators/penghasilan-final.js';

/**
 * A single `employeeType` field selects which PMK 168/2023 rule set applies —
 * pass the input matching that type and `calculatePPh21` dispatches to the
 * correct calculator with full type narrowing.
 */
export type PPh21Input =
  | PegawaiTetapInput
  | PegawaiTidakTetapInput
  | BukanPegawaiInput
  | PesertaKegiatanInput
  | DewanKomisarisInput
  | MantanPegawaiInput
  | PensiunanBerkalaInput
  | PenarikanDanaPensiunAwalInput
  | PenghasilanFinalInput;

export interface CalculatePPh21Options {
  /** Tax year whose constants to use. Defaults to the latest supported year. */
  taxYear?: number;
  /**
   * PMK 105/2025 PPh 21 DTP 2026 stimulus. Only takes effect when the
   * resolved tax year's config defines a `dtp` block and both `eligible`
   * and the baseline-month income threshold are satisfied. When applied,
   * the withheld tax is zeroed out and returned instead as `dtpAmount` —
   * cash the employer pays directly to the employee.
   */
  dtp?: {
    eligible: boolean;
    /** Gross income in the baseline month (Jan 2026, or first month worked) — eligibility is locked in from this figure. */
    baselineMonthlyGross: number;
  };
}

export function calculatePPh21(input: PPh21Input, options: CalculatePPh21Options = {}): PPh21Result {
  const config = getTaxYearConfig(options.taxYear);
  const result = dispatch(input, config);
  return applyDtpIfEligible(result, config, options.dtp);
}

function dispatch(input: PPh21Input, config: ReturnType<typeof getTaxYearConfig>): PPh21Result {
  switch (input.employeeType) {
    case 'pegawai-tetap':
      return calculatePegawaiTetap(input, config);
    case 'pegawai-tidak-tetap':
      return calculatePegawaiTidakTetap(input, config);
    case 'bukan-pegawai':
      return calculateBukanPegawai(input, config);
    case 'peserta-kegiatan':
      return calculatePesertaKegiatan(input, config);
    case 'dewan-komisaris':
      return calculateDewanKomisaris(input, config);
    case 'mantan-pegawai':
      return calculateMantanPegawai(input, config);
    case 'penerima-pensiun-berkala':
      return calculatePensiunanBerkala(input, config);
    case 'penarikan-dana-pensiun-awal':
      return calculatePenarikanDanaPensiunAwal(input, config);
    case 'penghasilan-final':
      return calculatePenghasilanFinal(input, config);
    default: {
      const exhaustiveCheck: never = input;
      throw new Error(`Unhandled employeeType: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

function applyDtpIfEligible(
  result: PPh21Result,
  config: ReturnType<typeof getTaxYearConfig>,
  dtp: CalculatePPh21Options['dtp'],
): PPh21Result {
  if (!dtp?.eligible || !config.dtp) return result;
  if (dtp.baselineMonthlyGross > config.dtp.maxMonthlyGross) return result;
  if (result.pph21 <= 0) return result;

  return {
    ...result,
    pph21: 0,
    pph21BeforeDtp: result.pph21,
    dtpAmount: result.pph21,
    regulation: `${result.regulation}; ${config.dtp.regulation}`,
  };
}

// Public re-exports for advanced/composable usage.
export { getTaxYearConfig, TAX_YEAR_CONFIGS, LATEST_TAX_YEAR };
export { resolvePtkp } from './core/resolve-ptkp.js';
export { lookupTerRate, getTerBracketsForCategory } from './core/ter-lookup.js';
export { applyProgressiveBrackets } from './core/progressive.js';
export { calculateBpjs } from './bpjs/calculate-bpjs.js';
export type {
  BpjsInput,
  BpjsResult,
  BpjsComponent,
  BpjsComponentLabel,
  JkkTierLabel,
} from './bpjs/calculate-bpjs.js';

export type {
  PtkpStatus,
  PtkpConfig,
  TerCategory,
  Bracket,
  TaxYearConfig,
  BpjsConfig,
  DtpConfig,
  DtpKbliSector,
  IsoDateString,
  IsoMonthString,
} from './constants/types.js';
export type { PPh21Result, BreakdownLine, CalculationMethod } from './core/result-types.js';

export type { PegawaiTetapInput } from './calculators/pegawai-tetap.js';
export type { PegawaiTidakTetapInput } from './calculators/pegawai-tidak-tetap.js';
export type { BukanPegawaiInput } from './calculators/bukan-pegawai.js';
export type { PesertaKegiatanInput } from './calculators/peserta-kegiatan.js';
export type { DewanKomisarisInput } from './calculators/dewan-komisaris.js';
export type { MantanPegawaiInput } from './calculators/mantan-pegawai.js';
export type {
  PensiunanBerkalaInput,
  PenarikanDanaPensiunAwalInput,
} from './calculators/pensiunan-berkala.js';
export type { PenghasilanFinalInput, PesangonInput, JhtJpLumpSumInput } from './calculators/penghasilan-final.js';
