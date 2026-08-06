import type { TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

export interface PesangonInput {
  employeeType: 'penghasilan-final';
  kind: 'pesangon';
  hasNpwp: boolean;
  grossIncome: number;
  /** Pesangon already received (and taxed) within the same 2-tax-year window, per PP 68/2009. */
  cumulativeReceivedBeforeThisPayment?: number;
}

export interface JhtJpLumpSumInput {
  employeeType: 'penghasilan-final';
  kind: 'jht-jp-lump-sum';
  hasNpwp: boolean;
  grossIncome: number;
}

export type PenghasilanFinalInput = PesangonInput | JhtJpLumpSumInput;

/**
 * Penghasilan Final atas Pesangon dan JHT/JP (PP 68/2009). Final tax — not
 * creditable against annual PPh, and not combined with other income. Both
 * schedules are marginal brackets, same mechanics as Pasal 17.
 */
export function calculatePenghasilanFinal(input: PenghasilanFinalInput, config: TaxYearConfig): PPh21Result {
  if (input.kind === 'pesangon') {
    const before = input.cumulativeReceivedBeforeThisPayment ?? 0;
    const after = before + input.grossIncome;

    const { tax: taxAfter } = applyProgressiveBrackets(after, config.finalTax.pesangon);
    const { tax: taxBefore } = applyProgressiveBrackets(before, config.finalTax.pesangon);
    const marginalTax = applyNpwpSurcharge(taxAfter - taxBefore, input.hasNpwp, config.npwpSurchargeMultiplier);
    const pph21 = roundDownRupiah(marginalTax);

    return {
      pph21,
      dpp: input.grossIncome,
      method: 'final',
      breakdown: [
        { label: 'Pesangon dibayarkan', amount: input.grossIncome },
        { label: 'Kumulatif pesangon (2 tahun pajak)', amount: after },
        { label: 'PPh 21 final (marjinal atas kumulatif)', amount: marginalTax },
      ],
      npwpSurchargeApplied: !input.hasNpwp,
      regulation: 'PP 68/2009',
    };
  }

  const { tax } = applyProgressiveBrackets(input.grossIncome, config.finalTax.jhtJpLumpSum);
  const taxWithSurcharge = applyNpwpSurcharge(tax, input.hasNpwp, config.npwpSurchargeMultiplier);
  const pph21 = roundDownRupiah(taxWithSurcharge);

  return {
    pph21,
    dpp: input.grossIncome,
    method: 'final',
    breakdown: [
      { label: 'Penarikan JHT/JP sekaligus', amount: input.grossIncome },
      { label: 'PPh 21 final', amount: taxWithSurcharge },
    ],
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: 'PP 68/2009',
  };
}
