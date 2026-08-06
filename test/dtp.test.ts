import { describe, it, expect } from 'vitest';
import { calculatePPh21 } from '../src/index.js';

describe('PMK 105/2025 DTP 2026 incentive', () => {
  it('zeroes withholding and reports dtpAmount when eligible and within threshold', () => {
    const result = calculatePPh21(
      {
        employeeType: 'pegawai-tetap',
        isFinalPeriod: false,
        ptkpStatus: 'TK0',
        hasNpwp: true,
        monthlyGrossIncome: 8_000_000,
      },
      { taxYear: 2026, dtp: { eligible: true, baselineMonthlyGross: 8_000_000 } },
    );
    expect(result.pph21).toBe(0);
    expect(result.dtpAmount).toBeGreaterThan(0);
    expect(result.pph21BeforeDtp).toBe(result.dtpAmount);
  });

  it('does not apply when baseline income exceeds Rp10.000.000/month', () => {
    const result = calculatePPh21(
      {
        employeeType: 'pegawai-tetap',
        isFinalPeriod: false,
        ptkpStatus: 'TK0',
        hasNpwp: true,
        monthlyGrossIncome: 12_000_000,
      },
      { taxYear: 2026, dtp: { eligible: true, baselineMonthlyGross: 12_000_000 } },
    );
    expect(result.pph21).toBeGreaterThan(0);
    expect(result.dtpAmount).toBeUndefined();
  });

  it('is not available for tax year 2024 (regulation only exists for 2026)', () => {
    const result = calculatePPh21(
      {
        employeeType: 'pegawai-tetap',
        isFinalPeriod: false,
        ptkpStatus: 'TK0',
        hasNpwp: true,
        monthlyGrossIncome: 8_000_000,
      },
      { taxYear: 2024, dtp: { eligible: true, baselineMonthlyGross: 8_000_000 } },
    );
    expect(result.dtpAmount).toBeUndefined();
    expect(result.pph21).toBeGreaterThan(0);
  });

  it('does not apply to a negative (refund) amount', () => {
    const result = calculatePPh21(
      {
        employeeType: 'pegawai-tetap',
        isFinalPeriod: true,
        ptkpStatus: 'TK0',
        hasNpwp: true,
        annualGrossIncome: 62_000_000,
        taxAlreadyWithheldYearToDate: 3_255_000,
        employeeJpContributionAnnual: 400_000,
        monthsWorked: 4,
      },
      { taxYear: 2026, dtp: { eligible: true, baselineMonthlyGross: 8_000_000 } },
    );
    expect(result.pph21).toBeLessThan(0);
    expect(result.dtpAmount).toBeUndefined();
  });
});
