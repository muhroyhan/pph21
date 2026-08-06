import { describe, it, expect } from 'vitest';
import { calculateBpjs } from '../src/index.js';
import { BPJS_2024 } from '../src/constants/bpjs.js';

describe('BPJS calculation', () => {
  it('computes all five components below every ceiling', () => {
    const result = calculateBpjs(
      { monthlyWage: 8_000_000, jkkTier: 'low', periodDate: '2024-06-01' },
      BPJS_2024,
    );
    expect(result.components.find((c) => c.label === 'JKK')?.employerAmount).toBeCloseTo(8_000_000 * 0.0054);
    expect(result.components.find((c) => c.label === 'JHT')?.employeeAmount).toBeCloseTo(8_000_000 * 0.02);
    expect(result.totalEmployer).toBeGreaterThan(0);
    expect(result.totalEmployee).toBeGreaterThan(0);
  });

  it('caps JP contribution base at the wage ceiling effective for the period', () => {
    const belowMarch2026 = calculateBpjs(
      { monthlyWage: 20_000_000, jkkTier: 'low', periodDate: '2026-02-01' },
      BPJS_2024,
    );
    const fromMarch2026 = calculateBpjs(
      { monthlyWage: 20_000_000, jkkTier: 'low', periodDate: '2026-03-01' },
      BPJS_2024,
    );
    expect(belowMarch2026.components.find((c) => c.label === 'JP')?.employerAmount).toBeCloseTo(
      10_547_400 * 0.02,
    );
    expect(fromMarch2026.components.find((c) => c.label === 'JP')?.employerAmount).toBeCloseTo(
      11_086_300 * 0.02,
    );
  });

  it('caps Kesehatan contribution base at Rp12.000.000', () => {
    const result = calculateBpjs(
      { monthlyWage: 20_000_000, jkkTier: 'low', periodDate: '2024-06-01' },
      BPJS_2024,
    );
    const kesehatan = result.components.find((c) => c.label === 'Kesehatan')!;
    expect(kesehatan.employerAmount).toBeCloseTo(12_000_000 * 0.04);
  });

  it('flags JKK/JKM/Kesehatan employer premiums as taxable, JHT/JP as not', () => {
    const result = calculateBpjs(
      { monthlyWage: 8_000_000, jkkTier: 'low', periodDate: '2024-06-01' },
      BPJS_2024,
    );
    const taxableLabels = result.components.filter((c) => c.employerPortionTaxable).map((c) => c.label);
    expect(taxableLabels.sort()).toEqual(['JKK', 'JKM', 'Kesehatan']);
  });

  it('flags JHT/JP employee contributions as deductible, Kesehatan as not', () => {
    const result = calculateBpjs(
      { monthlyWage: 8_000_000, jkkTier: 'low', periodDate: '2024-06-01' },
      BPJS_2024,
    );
    const deductibleLabels = result.components
      .filter((c) => c.employeePortionDeductible)
      .map((c) => c.label);
    expect(deductibleLabels.sort()).toEqual(['JHT', 'JP']);
  });

  it('throws on an unknown JKK tier', () => {
    expect(() =>
      calculateBpjs(
        { monthlyWage: 8_000_000, jkkTier: 'nonexistent' as never, periodDate: '2024-06-01' },
        BPJS_2024,
      ),
    ).toThrow(/Unknown JKK tier/);
  });
});
