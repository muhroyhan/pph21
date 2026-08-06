import type { TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

export interface BukanPegawaiInput {
  employeeType: 'bukan-pegawai';
  hasNpwp: boolean;
  grossIncome: number;
  /**
   * DPP (50% × gross) already accumulated this year from prior payments to
   * this same person by this same withholder, for imbalan berkesinambungan.
   * Defaults to 0, which treats this as a single, non-cumulative payment.
   */
  cumulativeDppBeforeThisPayment?: number;
}

/**
 * Bukan Pegawai (PMK 168/2023, resume halaman 14): PPh21 = Ph.Bruto × 50% ×
 * Tarif Pasal 17. PMK 168/2023 removed the old distinction between
 * berkesinambungan and non-berkesinambungan honoraria; `cumulativeDppBeforeThisPayment`
 * is provided so a withholder tracking cumulative DPP across the year for
 * the same recipient can still get marginal-correct results.
 */
export function calculateBukanPegawai(input: BukanPegawaiInput, config: TaxYearConfig): PPh21Result {
  const dppThisPayment = input.grossIncome * 0.5;
  const cumulativeBefore = input.cumulativeDppBeforeThisPayment ?? 0;
  const cumulativeAfter = cumulativeBefore + dppThisPayment;

  const { tax: taxAfter } = applyProgressiveBrackets(cumulativeAfter, config.article17);
  const { tax: taxBefore } = applyProgressiveBrackets(cumulativeBefore, config.article17);
  const marginalTax = taxAfter - taxBefore;

  const pph21 = roundDownRupiah(applyNpwpSurcharge(marginalTax, input.hasNpwp, config.npwpSurchargeMultiplier));

  return {
    pph21,
    dpp: dppThisPayment,
    method: 'pasal-17',
    breakdown: [
      { label: 'Penghasilan bruto', amount: input.grossIncome },
      { label: 'Dasar pengenaan pajak (50%)', amount: dppThisPayment },
      { label: 'PPh 21 (Tarif Pasal 17, marjinal atas kumulatif)', amount: marginalTax },
    ],
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: config.regulations.article17,
  };
}
