import { describe, it, expect } from 'vitest';
import { calculatePPh21 } from '../src/index.js';

describe('bukan-pegawai', () => {
  it('single payment: 50% DPP x Pasal 17', () => {
    const result = calculatePPh21({
      employeeType: 'bukan-pegawai',
      hasNpwp: true,
      grossIncome: 20_000_000,
    });
    // DPP = 10.000.000, all in 5% bracket
    expect(result.dpp).toBe(10_000_000);
    expect(result.pph21).toBe(500_000);
  });

  it('cumulative DPP crossing into the 15% bracket is taxed marginally', () => {
    // Cumulative DPP before this payment already at 55.000.000 (within 5% band, threshold 60jt)
    const result = calculatePPh21({
      employeeType: 'bukan-pegawai',
      hasNpwp: true,
      grossIncome: 20_000_000, // DPP this payment = 10.000.000
      cumulativeDppBeforeThisPayment: 55_000_000,
    });
    // 5.000.000 taxed at 5% (up to 60jt) + 5.000.000 taxed at 15% (above 60jt)
    const expected = 5_000_000 * 0.05 + 5_000_000 * 0.15;
    expect(result.pph21).toBe(Math.floor(expected));
  });
});

describe('peserta-kegiatan', () => {
  it('prize income taxed directly at Pasal 17, no PTKP/deduction', () => {
    const result = calculatePPh21({
      employeeType: 'peserta-kegiatan',
      hasNpwp: true,
      grossIncome: 10_000_000,
    });
    expect(result.dpp).toBe(10_000_000);
    expect(result.pph21).toBe(500_000); // 5%
  });
});

describe('mantan-pegawai', () => {
  it('bonus to former employee taxed at Pasal 17', () => {
    const result = calculatePPh21({
      employeeType: 'mantan-pegawai',
      hasNpwp: true,
      grossIncome: 10_000_000,
    });
    expect(result.pph21).toBe(500_000);
  });
});

describe('dewan-komisaris', () => {
  it('irregular commissioner honorarium uses TER Bulanan', () => {
    const result = calculatePPh21({
      employeeType: 'dewan-komisaris',
      ptkpStatus: 'TK0',
      hasNpwp: true,
      grossIncome: 15_500_000,
    });
    expect(result.ter?.rate).toBe(0.07);
    expect(result.pph21).toBe(1_085_000);
  });
});

describe('penarikan-dana-pensiun-awal', () => {
  it('early pension withdrawal taxed at Pasal 17 (not final)', () => {
    const result = calculatePPh21({
      employeeType: 'penarikan-dana-pensiun-awal',
      hasNpwp: true,
      grossIncome: 10_000_000,
    });
    expect(result.pph21).toBe(500_000);
    expect(result.method).toBe('pasal-17');
  });
});

describe('penghasilan-final — pesangon', () => {
  it('50.000.000 or less is untaxed', () => {
    const result = calculatePPh21({
      employeeType: 'penghasilan-final',
      kind: 'pesangon',
      hasNpwp: true,
      grossIncome: 50_000_000,
    });
    expect(result.pph21).toBe(0);
  });

  it('100.000.000 crosses the 0%/5% boundary marginally', () => {
    const result = calculatePPh21({
      employeeType: 'penghasilan-final',
      kind: 'pesangon',
      hasNpwp: true,
      grossIncome: 100_000_000,
    });
    // First 50jt at 0%, next 50jt at 5%
    expect(result.pph21).toBe(2_500_000);
  });
});

describe('penghasilan-final — JHT/JP lump sum', () => {
  it('above 50.000.000 taxed at flat 5% on the excess', () => {
    const result = calculatePPh21({
      employeeType: 'penghasilan-final',
      kind: 'jht-jp-lump-sum',
      hasNpwp: true,
      grossIncome: 70_000_000,
    });
    expect(result.pph21).toBe(1_000_000); // (70jt - 50jt) * 5%
  });
});
