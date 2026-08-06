import type { Bracket, TerCategory } from '../constants/types.js';

export interface TerLookupResult {
  rate: number;
  bracketMin: number;
  bracketMax: number | null;
}

/**
 * TER (unlike Article 17) is a single flat rate applied to the *whole* gross
 * amount for whichever bracket it falls into — not a marginal walk.
 */
export function lookupTerRate(grossAmount: number, brackets: Bracket[]): TerLookupResult {
  for (const bracket of brackets) {
    const withinMin = grossAmount >= bracket.min;
    const withinMax = bracket.max === null || grossAmount <= bracket.max;
    if (withinMin && withinMax) {
      return { rate: bracket.rate, bracketMin: bracket.min, bracketMax: bracket.max };
    }
  }
  // Gross below zero, or a genuinely malformed table — surface it rather
  // than silently returning 0%, since either indicates a caller/data bug.
  throw new Error(`No TER bracket matches gross amount ${grossAmount}`);
}

export function getTerBracketsForCategory(
  ter: { A: Bracket[]; B: Bracket[]; C: Bracket[] },
  category: TerCategory,
): Bracket[] {
  return ter[category];
}
