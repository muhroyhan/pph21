import { describe, it, expect } from 'vitest';
import { applyProgressiveBrackets } from '../src/index.js';
import { ARTICLE17_BRACKETS_2024 } from '../src/constants/article17.js';

/**
 * Regression test for an off-by-one that inflated the first bracket's span
 * by 1 rupiah (60.000.001 instead of 60.000.000), silently taxing the
 * 60.000.001st rupiah at 5% instead of 15%. Caught by golden cumulative-DPP
 * cases in other-calculators.test.ts landing 1 rupiah short of the expected
 * marginal tax whenever a computation straddled a bracket boundary.
 */
describe('applyProgressiveBrackets — bracket boundary', () => {
  it('exactly at the first bracket ceiling (60jt) is taxed entirely at 5%', () => {
    const { tax } = applyProgressiveBrackets(60_000_000, ARTICLE17_BRACKETS_2024);
    expect(tax).toBe(3_000_000);
  });

  it('one rupiah into the second bracket taxes only that rupiah at 15%', () => {
    const { tax } = applyProgressiveBrackets(60_000_001, ARTICLE17_BRACKETS_2024);
    expect(tax).toBeCloseTo(3_000_000 + 0.15, 5);
  });

  it('spanning three brackets sums each slice at its own rate', () => {
    // 60jt @5% + 190jt @15% + 1 rupiah @25%
    const { tax } = applyProgressiveBrackets(250_000_001, ARTICLE17_BRACKETS_2024);
    expect(tax).toBeCloseTo(60_000_000 * 0.05 + 190_000_000 * 0.15 + 1 * 0.25, 5);
  });
});
