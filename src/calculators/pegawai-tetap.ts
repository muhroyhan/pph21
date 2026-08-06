import type { PtkpStatus, TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { resolvePtkp } from '../core/resolve-ptkp.js';
import { lookupTerRate } from '../core/ter-lookup.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah, roundDownToThousand } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

interface MonthlyInput {
  employeeType: 'pegawai-tetap';
  isFinalPeriod: false;
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  monthlyGrossIncome: number;
}

interface FinalPeriodInput {
  employeeType: 'pegawai-tetap';
  isFinalPeriod: true;
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  /** Total gross income received across the year (or the portion of the year worked). */
  annualGrossIncome: number;
  /** Sum of PPh 21 already withheld in prior months of this tax year (Jan–Nov, or since hire). */
  taxAlreadyWithheldYearToDate: number;
  /** Employee-paid JHT contribution for the year, deductible from taxable income. */
  employeeJhtContributionAnnual?: number;
  /** Employee-paid JP contribution for the year, deductible from taxable income. */
  employeeJpContributionAnnual?: number;
  /** Months actually worked in the tax year (default 12). Used to pro-rate the biaya jabatan cap. */
  monthsWorked?: number;
}

export type PegawaiTetapInput = MonthlyInput | FinalPeriodInput;

/**
 * Pegawai Tetap (PMK 168/2023, resume halaman 14):
 *  - Jan–Nov (or any non-final month): PPh21 = Ph.Bruto bulanan × TER Bulanan.
 *  - Final month (December, or the employee's last month of work): PPh21 =
 *    (PKP setahun × Tarif Pasal 17) − pajak yang sudah dipotong sepanjang tahun.
 *    This can be negative — an over-withholding refund — and is returned as-is.
 */
export function calculatePegawaiTetap(input: PegawaiTetapInput, config: TaxYearConfig): PPh21Result {
  const ptkp = resolvePtkp(input.ptkpStatus, config.ptkp);

  if (!input.isFinalPeriod) {
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

  const monthsWorked = input.monthsWorked ?? 12;
  const biayaJabatan = Math.min(
    input.annualGrossIncome * config.deductions.biayaJabatanRate,
    config.deductions.biayaJabatanMonthlyCap * monthsWorked,
  );
  const employeeJht = input.employeeJhtContributionAnnual ?? 0;
  const employeeJp = input.employeeJpContributionAnnual ?? 0;

  const netIncome = input.annualGrossIncome - biayaJabatan - employeeJht - employeeJp;
  const dpp = Math.max(0, netIncome - ptkp.annualAmount);
  const pkp = roundDownToThousand(dpp);

  const { tax: annualTax } = applyProgressiveBrackets(pkp, config.article17);
  const taxWithSurcharge = applyNpwpSurcharge(annualTax, input.hasNpwp, config.npwpSurchargeMultiplier);
  const pph21 = roundDownRupiah(taxWithSurcharge - input.taxAlreadyWithheldYearToDate);

  return {
    pph21,
    dpp: pkp,
    method: 'pasal-17',
    breakdown: [
      { label: 'Penghasilan bruto setahun', amount: input.annualGrossIncome },
      { label: 'Biaya jabatan', amount: -biayaJabatan },
      { label: 'Iuran JHT (pegawai)', amount: -employeeJht },
      { label: 'Iuran JP (pegawai)', amount: -employeeJp },
      { label: `PTKP (${ptkp.status})`, amount: -ptkp.annualAmount },
      { label: 'PKP (dibulatkan ke bawah)', amount: pkp },
      { label: 'PPh 21 terutang setahun (Pasal 17)', amount: taxWithSurcharge },
      { label: 'Dikurangi PPh 21 dipotong Jan–Nov', amount: -input.taxAlreadyWithheldYearToDate },
    ],
    ptkp: { status: ptkp.status, annualAmount: ptkp.annualAmount },
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: `${config.regulations.ter}; ${config.regulations.article17}`,
  };
}
