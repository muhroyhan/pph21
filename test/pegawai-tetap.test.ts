import { describe, it, expect } from 'vitest';
import { calculatePPh21 } from '../src/index.js';

/**
 * Golden cases transcribed from PMK 168/2023 Lampiran, "Contoh Penghitungan
 * PPh Pasal 21 Atas Pegawai Tetap Yang Menerima Atau Memperoleh Penghasilan
 * Dalam Satu Tahun Pajak" (Tuan A, K/0) — halaman 28. Asserts our TER lookup
 * and multiplication match the officially published rupiah figures exactly.
 */
describe('pegawai-tetap — monthly TER (Tuan A, K/0)', () => {
  it('Januari: gross 30.080.000 -> TER A 13% -> 3.910.400', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: false,
      ptkpStatus: 'K0',
      hasNpwp: true,
      monthlyGrossIncome: 30_080_000,
    });
    expect(result.ter?.rate).toBe(0.13);
    expect(result.pph21).toBe(3_910_400);
  });

  it('Februari (with THR): gross 35.080.000 -> TER A 14% -> 4.911.200', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: false,
      ptkpStatus: 'K0',
      hasNpwp: true,
      monthlyGrossIncome: 35_080_000,
    });
    expect(result.ter?.rate).toBe(0.14);
    expect(result.pph21).toBe(4_911_200);
  });

  it('Juli (with bonus): gross 50.080.000 -> TER A 18% -> 9.014.400', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: false,
      ptkpStatus: 'K0',
      hasNpwp: true,
      monthlyGrossIncome: 50_080_000,
    });
    expect(result.ter?.rate).toBe(0.18);
    expect(result.pph21).toBe(9_014_400);
  });
});

/**
 * Golden case transcribed from PMK 168/2023 Lampiran, "Contoh Penghitungan
 * PPh Pasal 21 Atas Pegawai Tetap Yang ... Baru Bekerja Pada Pertengahan
 * Tahun" (Tuan B, TK/0, joined Sept 2024) — halaman 29. Monthly TER figures
 * are the officially published numbers; the final-month figure is derived
 * from the documented formula (not shown numerically in the source PDF) and
 * serves as a self-consistency check of the December reconciliation path.
 */
describe('pegawai-tetap — mid-year hire (Tuan B, TK/0)', () => {
  it('September: gross 15.500.000 -> TER A 7% -> 1.085.000', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: false,
      ptkpStatus: 'TK0',
      hasNpwp: true,
      monthlyGrossIncome: 15_500_000,
    });
    expect(result.ter?.rate).toBe(0.07);
    expect(result.pph21).toBe(1_085_000);
  });

  it('December (final): 4 months worked, annual gross 62.000.000, JP 400.000, withheld Sep-Nov 3.255.000', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: true,
      ptkpStatus: 'TK0',
      hasNpwp: true,
      annualGrossIncome: 62_000_000,
      taxAlreadyWithheldYearToDate: 3_255_000,
      employeeJpContributionAnnual: 400_000,
      monthsWorked: 4,
    });
    // biaya jabatan = min(5% * 62jt, 500rb * 4) = min(3.1jt, 2jt) = 2jt
    // net = 62jt - 2jt - 0.4jt = 59.6jt; DPP = 59.6jt - 54jt (PTKP TK/0) = 5.6jt
    // tax = 5.6jt * 5% = 280.000; final = 280.000 - 3.255.000 = -2.975.000 (refund)
    expect(result.dpp).toBe(5_600_000);
    expect(result.pph21).toBe(-2_975_000);
  });
});

describe('pegawai-tetap — non-NPWP surcharge', () => {
  it('applies 20% surcharge on monthly TER', () => {
    const withNpwp = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: false,
      ptkpStatus: 'TK0',
      hasNpwp: true,
      monthlyGrossIncome: 15_500_000,
    });
    const withoutNpwp = calculatePPh21({
      employeeType: 'pegawai-tetap',
      isFinalPeriod: false,
      ptkpStatus: 'TK0',
      hasNpwp: false,
      monthlyGrossIncome: 15_500_000,
    });
    expect(withoutNpwp.pph21).toBe(Math.floor(withNpwp.pph21 * 1.2));
    expect(withoutNpwp.npwpSurchargeApplied).toBe(true);
  });
});
