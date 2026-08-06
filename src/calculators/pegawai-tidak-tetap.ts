import type { PtkpStatus, TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { resolvePtkp } from '../core/resolve-ptkp.js';
import { lookupTerRate } from '../core/ter-lookup.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

interface DailyInput {
  employeeType: 'pegawai-tidak-tetap';
  paidMonthly: false;
  hasNpwp: boolean;
  dailyGrossIncome: number;
}

interface MonthlyInput {
  employeeType: 'pegawai-tidak-tetap';
  paidMonthly: true;
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  monthlyGrossIncome: number;
}

export type PegawaiTidakTetapInput = DailyInput | MonthlyInput;

/**
 * Pegawai Tidak Tetap (PMK 168/2023, resume halaman 14):
 *  - Dibayar bulanan: PPh21 = Ph.Bruto bulanan × TER Bulanan (same tables as pegawai tetap).
 *  - Tidak dibayar bulanan (upah harian/satuan/borongan), Rp0–2.500.000/hari:
 *    PPh21 = Ph.Bruto harian × TER Harian.
 *  - Tidak dibayar bulanan, >Rp2.500.000/hari: PPh21 = Ph.Bruto × 50% × Tarif Pasal 17.
 *
 * v1 note: this computes each daily payment independently, per the official
 * resume slide's literal formula. It does not track cumulative monthly wage
 * to detect the point a daily worker's income should convert to progressive
 * treatment for the month — see README "Out of scope" for details.
 */
export function calculatePegawaiTidakTetap(
  input: PegawaiTidakTetapInput,
  config: TaxYearConfig,
): PPh21Result {
  if (input.paidMonthly) {
    const ptkp = resolvePtkp(input.ptkpStatus, config.ptkp);
    const terBrackets = config.ter[ptkp.terCategory];
    const { rate } = lookupTerRate(input.monthlyGrossIncome, terBrackets);
    const baseTax = input.monthlyGrossIncome * rate;
    const pph21 = roundDownRupiah(applyNpwpSurcharge(baseTax, input.hasNpwp, config.npwpSurchargeMultiplier));

    return {
      pph21,
      dpp: input.monthlyGrossIncome,
      method: 'ter-bulanan',
      ter: { category: ptkp.terCategory, rate },
      breakdown: [
        { label: 'Penghasilan bruto bulanan', amount: input.monthlyGrossIncome },
        { label: `TER ${ptkp.terCategory} (${(rate * 100).toFixed(2)}%)`, amount: baseTax },
      ],
      ptkp: { status: ptkp.status, annualAmount: ptkp.annualAmount },
      npwpSurchargeApplied: !input.hasNpwp,
      regulation: config.regulations.ter,
    };
  }

  if (input.dailyGrossIncome <= 2_500_000) {
    const { rate } = lookupTerRate(input.dailyGrossIncome, config.ter.harian);
    const baseTax = input.dailyGrossIncome * rate;
    const pph21 = roundDownRupiah(applyNpwpSurcharge(baseTax, input.hasNpwp, config.npwpSurchargeMultiplier));

    return {
      pph21,
      dpp: input.dailyGrossIncome,
      method: 'ter-harian', // TER Harian has no A/B/C split, so `ter.category` is omitted here
      breakdown: [
        { label: 'Penghasilan bruto harian', amount: input.dailyGrossIncome },
        { label: `TER Harian (${(rate * 100).toFixed(2)}%)`, amount: baseTax },
      ],
      npwpSurchargeApplied: !input.hasNpwp,
      regulation: config.regulations.ter,
    };
  }

  const dpp = input.dailyGrossIncome * 0.5;
  const { tax } = applyProgressiveBrackets(dpp, config.article17);
  const pph21 = roundDownRupiah(applyNpwpSurcharge(tax, input.hasNpwp, config.npwpSurchargeMultiplier));

  return {
    pph21,
    dpp,
    method: 'pasal-17',
    breakdown: [
      { label: 'Penghasilan bruto harian', amount: input.dailyGrossIncome },
      { label: 'Dasar pengenaan pajak (50%)', amount: dpp },
      { label: 'PPh 21 (Tarif Pasal 17)', amount: tax },
    ],
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: `${config.regulations.ter}; ${config.regulations.article17}`,
  };
}
