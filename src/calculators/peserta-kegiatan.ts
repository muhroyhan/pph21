import type { TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

export interface PesertaKegiatanInput {
  employeeType: 'peserta-kegiatan';
  hasNpwp: boolean;
  grossIncome: number;
}

/**
 * Peserta Kegiatan (PMK 168/2023, resume halaman 14) — hadiah/imbalan
 * sehubungan dengan kegiatan (e.g. perlombaan). PPh21 = Ph.Bruto × Tarif
 * Pasal 17, applied per masa pajak with no deduction and no PTKP.
 */
export function calculatePesertaKegiatan(input: PesertaKegiatanInput, config: TaxYearConfig): PPh21Result {
  const { tax } = applyProgressiveBrackets(input.grossIncome, config.article17);
  const pph21 = roundDownRupiah(applyNpwpSurcharge(tax, input.hasNpwp, config.npwpSurchargeMultiplier));

  return {
    pph21,
    dpp: input.grossIncome,
    method: 'pasal-17',
    breakdown: [
      { label: 'Penghasilan bruto (hadiah/imbalan kegiatan)', amount: input.grossIncome },
      { label: 'PPh 21 (Tarif Pasal 17)', amount: tax },
    ],
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: config.regulations.article17,
  };
}
