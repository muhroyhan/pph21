import type { PtkpStatus, TaxYearConfig } from '../constants/types.js';
import type { PPh21Result } from '../core/result-types.js';
import { resolvePtkp } from '../core/resolve-ptkp.js';
import { lookupTerRate } from '../core/ter-lookup.js';
import { applyProgressiveBrackets } from '../core/progressive.js';
import { roundDownRupiah, roundDownToThousand } from '../core/rounding.js';
import { applyNpwpSurcharge } from '../core/npwp-surcharge.js';

interface MonthlyInput {
  employeeType: 'penerima-pensiun-berkala';
  isFinalPeriod: false;
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  monthlyGrossIncome: number;
}

interface FinalPeriodInput {
  employeeType: 'penerima-pensiun-berkala';
  isFinalPeriod: true;
  ptkpStatus: PtkpStatus;
  hasNpwp: boolean;
  annualGrossIncome: number;
  taxAlreadyWithheldYearToDate: number;
  monthsReceived?: number;
}

export type PensiunanBerkalaInput = MonthlyInput | FinalPeriodInput;

/**
 * Penerima Pensiun Berkala (PMK 168/2023, resume halaman 14) — grouped with
 * pegawai tetap under "PEGAWAI TETAP & PENSIUNAN atas seluruh penghasilan":
 * same TER-monthly / Pasal-17-final structure, but the deduction is biaya
 * pensiun (not biaya jabatan) and there is no BPJS JHT/JP employee deduction.
 */
export function calculatePensiunanBerkala(input: PensiunanBerkalaInput, config: TaxYearConfig): PPh21Result {
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
        { label: 'Uang pensiun bruto bulanan', amount: input.monthlyGrossIncome },
        { label: `TER ${ptkp.terCategory} (${(rate * 100).toFixed(2)}%)`, amount: baseTax },
      ],
      ptkp: { status: ptkp.status, annualAmount: ptkp.annualAmount },
      npwpSurchargeApplied: !input.hasNpwp,
      regulation: config.regulations.ter,
    };
  }

  const monthsReceived = input.monthsReceived ?? 12;
  const biayaPensiun = Math.min(
    input.annualGrossIncome * config.deductions.biayaPensiunRate,
    config.deductions.biayaPensiunMonthlyCap * monthsReceived,
  );

  const netIncome = input.annualGrossIncome - biayaPensiun;
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
      { label: 'Uang pensiun bruto setahun', amount: input.annualGrossIncome },
      { label: 'Biaya pensiun', amount: -biayaPensiun },
      { label: `PTKP (${ptkp.status})`, amount: -ptkp.annualAmount },
      { label: 'PKP (dibulatkan ke bawah)', amount: pkp },
      { label: 'PPh 21 terutang setahun (Pasal 17)', amount: taxWithSurcharge },
      { label: 'Dikurangi PPh 21 dipotong sebelumnya', amount: -input.taxAlreadyWithheldYearToDate },
    ],
    ptkp: { status: ptkp.status, annualAmount: ptkp.annualAmount },
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: `${config.regulations.ter}; ${config.regulations.article17}`,
  };
}

export interface PenarikanDanaPensiunAwalInput {
  employeeType: 'penarikan-dana-pensiun-awal';
  hasNpwp: boolean;
  grossIncome: number;
}

/**
 * Peserta Program Pensiun (pegawai) yang menarik dana pensiun di awal
 * (PMK 168/2023, resume halaman 14) — an active employee's early pension
 * fund withdrawal, distinct from the final lump-sum-at-retirement tax in
 * penghasilan-final.ts. PPh21 = Ph.Bruto × Tarif Pasal 17 (ordinary, not final).
 */
export function calculatePenarikanDanaPensiunAwal(
  input: PenarikanDanaPensiunAwalInput,
  config: TaxYearConfig,
): PPh21Result {
  const { tax } = applyProgressiveBrackets(input.grossIncome, config.article17);
  const pph21 = roundDownRupiah(applyNpwpSurcharge(tax, input.hasNpwp, config.npwpSurchargeMultiplier));

  return {
    pph21,
    dpp: input.grossIncome,
    method: 'pasal-17',
    breakdown: [
      { label: 'Penarikan dana pensiun (awal)', amount: input.grossIncome },
      { label: 'PPh 21 (Tarif Pasal 17)', amount: tax },
    ],
    npwpSurchargeApplied: !input.hasNpwp,
    regulation: config.regulations.article17,
  };
}
