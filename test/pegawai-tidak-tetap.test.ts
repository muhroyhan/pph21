import { describe, it, expect } from 'vitest';
import { calculatePPh21 } from '../src/index.js';

describe('pegawai-tidak-tetap', () => {
  it('daily wage at exactly 450.000 -> 0% TER Harian', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tidak-tetap',
      paidMonthly: false,
      hasNpwp: true,
      dailyGrossIncome: 450_000,
    });
    expect(result.pph21).toBe(0);
    expect(result.method).toBe('ter-harian');
  });

  it('daily wage just above 450.000 -> 0.5% TER Harian', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tidak-tetap',
      paidMonthly: false,
      hasNpwp: true,
      dailyGrossIncome: 500_000,
    });
    expect(result.pph21).toBe(2_500); // 500.000 * 0.5%
  });

  it('daily wage above 2.500.000 -> 50% x Pasal 17', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tidak-tetap',
      paidMonthly: false,
      hasNpwp: true,
      dailyGrossIncome: 3_000_000,
    });
    // DPP = 1.500.000, entirely within the 5% Article 17 bracket
    expect(result.dpp).toBe(1_500_000);
    expect(result.pph21).toBe(75_000);
    expect(result.method).toBe('pasal-17');
  });

  it('paid monthly -> uses TER Bulanan like pegawai tetap', () => {
    const result = calculatePPh21({
      employeeType: 'pegawai-tidak-tetap',
      paidMonthly: true,
      ptkpStatus: 'TK0',
      hasNpwp: true,
      monthlyGrossIncome: 15_500_000,
    });
    expect(result.ter?.rate).toBe(0.07);
    expect(result.pph21).toBe(1_085_000);
  });
});
