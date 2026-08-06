import type { Bracket } from '../constants/types.js';

export interface ProgressiveBreakdownLine {
  bracketMin: number;
  bracketMax: number | null;
  rate: number;
  taxableInBracket: number;
  tax: number;
}

export interface ProgressiveResult {
  tax: number;
  lines: ProgressiveBreakdownLine[];
}

/**
 * Walks a set of progressive brackets (Article 17, pesangon, JHT/JP lump sum)
 * and applies each bracket's rate only to the slice of `amount` that falls
 * within it — the standard marginal-tax-bracket algorithm shared by every
 * calculator that needs Pasal 17.
 */
export function applyProgressiveBrackets(amount: number, brackets: Bracket[]): ProgressiveResult {
  if (amount <= 0) {
    return { tax: 0, lines: [] };
  }

  let remaining = amount;
  let tax = 0;
  const lines: ProgressiveBreakdownLine[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    // Non-first brackets start at (previous bracket's max + 1), so their true
    // span is max - min + 1. The first bracket's `min` is 0 itself (not a
    // "previous max + 1"), so its span is just `max` — subtracting the +1
    // here avoids taxing one extra rupiah into the lowest bracket.
    const bracketSpan =
      bracket.max === null ? remaining : bracket.max - bracket.min + (bracket.min === 0 ? 0 : 1);
    const taxableInBracket = Math.min(remaining, bracketSpan);
    if (taxableInBracket <= 0) continue;

    const bracketTax = taxableInBracket * bracket.rate;
    tax += bracketTax;
    lines.push({
      bracketMin: bracket.min,
      bracketMax: bracket.max,
      rate: bracket.rate,
      taxableInBracket,
      tax: bracketTax,
    });
    remaining -= taxableInBracket;
  }

  return { tax, lines };
}
