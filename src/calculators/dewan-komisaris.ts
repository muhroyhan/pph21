import type { PtkpStatus, TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { resolvePtkp } from '../core/resolve-ptkp.js';
import { lookupTerRate } from '../core/ter-lookup.js';
import { roundDownRupiah } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

export interface DewanKomisarisInput {
  employeeType: 'dewan-komisaris';
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  /** Honorarium or other irregular income paid to a non-employee commissioner/supervisor this period. */
  grossIncome: number;
}

/**
 * Anggota Dewan Komisaris/Pengawas yang menerima penghasilan tidak teratur
 * (PMK 168/2023, resume halaman 14): PPh21 = Ph.Bruto × TER Bulanan, applied
 * per masa pajak — the same monthly TER tables as pegawai tetap, keyed off
 * the commissioner's own PTKP status.
 */
export function calculateDewanKomisaris(input: DewanKomisarisInput, config: TaxYearConfig): PPh21Result {
  const ptkp = resolvePtkp(input.ptkpStatus, config.ptkp);
  const terBrackets = config.ter[ptkp.terCategory];
  const { rate } = lookupTerRate(input.grossIncome, terBrackets);
  const baseTax = input.grossIncome * rate;
  const pph21 = roundDownRupiah(applyNpwpSurcharge(baseTax, input.hasNpwp, config.npwpSurchargeMultiplier));

  return {
    pph21,
    dpp: input.grossIncome,
    method: 'ter-bulanan',
    ter: { category: ptkp.terCategory, rate },
    breakdown: [
      { label: 'Penghasilan bruto (honor tidak teratur)', amount: input.grossIncome },
      { label: `TER ${ptkp.terCategory} (${(rate * 100).toFixed(2)}%)`, amount: baseTax },
    ],
    ptkp: { status: ptkp.status, annualAmount: ptkp.annualAmount },
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: config.regulations.ter,
  };
}
