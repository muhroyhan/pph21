import { describe, it, expect } from 'vitest';
import { TER_A_2024, TER_B_2024, TER_C_2024, TER_HARIAN_2024 } from '../src/constants/ter.js';
import type { Bracket } from '../src/constants/types.js';

/**
 * These invariants exist because two independent secondary sources consulted
 * during research gave conflicting, internally-inconsistent TER B/C tables
 * (missing rows, wrong ordering). The tables in src/constants/ter.ts were
 * re-transcribed from the official PMK 168/2023 PDF; these tests catch the
 * exact class of transcription error found in those sources.
 */
function expectContiguousNonDecreasing(brackets: Bracket[]) {
  expect(brackets[0]?.min).toBe(0);
  for (let i = 0; i < brackets.length - 1; i++) {
    const current = brackets[i]!;
    const next = brackets[i + 1]!;
    expect(current.max).not.toBeNull();
    expect(next.min).toBe((current.max as number) + 1);
    expect(next.rate).toBeGreaterThanOrEqual(current.rate);
  }
  expect(brackets.at(-1)?.max).toBeNull();
}

describe('TER table integrity', () => {
  it('TER A has 44 brackets, 0%-34%, contiguous', () => {
    expect(TER_A_2024).toHaveLength(44);
    expect(TER_A_2024[0]?.rate).toBe(0);
    expect(TER_A_2024.at(-1)?.rate).toBe(0.34);
    expectContiguousNonDecreasing(TER_A_2024);
  });

  it('TER B has 40 brackets, 0%-34%, contiguous', () => {
    expect(TER_B_2024).toHaveLength(40);
    expect(TER_B_2024[0]?.rate).toBe(0);
    expect(TER_B_2024.at(-1)?.rate).toBe(0.34);
    expectContiguousNonDecreasing(TER_B_2024);
  });

  it('TER C has 41 brackets, 0%-34%, contiguous', () => {
    expect(TER_C_2024).toHaveLength(41);
    expect(TER_C_2024[0]?.rate).toBe(0);
    expect(TER_C_2024.at(-1)?.rate).toBe(0.34);
    expectContiguousNonDecreasing(TER_C_2024);
  });

  it('TER Harian has 2 brackets: 0% up to 450rb, 0.5% up to 2.5jt', () => {
    expect(TER_HARIAN_2024).toEqual([
      { min: 0, max: 450_000, rate: 0.0 },
      { min: 450_001, max: 2_500_000, rate: 0.005 },
    ]);
  });
});
