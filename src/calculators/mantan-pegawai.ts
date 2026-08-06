import type { TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

export interface MantanPegawaiInput {
  employeeType: 'mantan-pegawai';
  hasNpwp: boolean;
  /** Jasa produksi, tantiem, gratifikasi, bonus, or other irregular payment to a former employee. */
  grossIncome: number;
}

/**
 * Mantan Pegawai (PMK 168/2023, resume halaman 14) — jasa produksi, tantiem,
 * gratifikasi, bonus, atau imbalan lain dibayar kepada mantan pegawai.
 * PPh21 = Ph.Bruto × Tarif Pasal 17, applied per masa pajak.
 */
export function calculateMantanPegawai(input: MantanPegawaiInput, config: TaxYearConfig): PPh21Result {
  const { tax } = applyProgressiveBrackets(input.grossIncome, config.article17);
  const pph21 = roundDownRupiah(applyNpwpSurcharge(tax, input.hasNpwp, config.npwpSurchargeMultiplier));

  return {
    pph21,
    dpp: input.grossIncome,
    method: 'pasal-17',
    breakdown: [
      { label: 'Penghasilan bruto (jasa produksi/tantiem/gratifikasi/bonus)', amount: input.grossIncome },
      { label: 'PPh 21 (Tarif Pasal 17)', amount: tax },
    ],
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: config.regulations.article17,
  };
}
