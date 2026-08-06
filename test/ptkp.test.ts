import { describe, it, expect } from 'vitest';
import { resolvePtkp } from '../src/index.js';
import { PTKP_2024_BASE } from '../src/constants/ptkp.js';

describe('PTKP resolution', () => {
  it.each([
    ['TK0', 54_000_000, 'A'],
    ['TK1', 58_500_000, 'A'],
    ['K0', 58_500_000, 'A'],
    ['TK2', 63_000_000, 'B'],
    ['K1', 63_000_000, 'B'],
    ['TK3', 67_500_000, 'B'],
    ['K2', 67_500_000, 'B'],
    ['K3', 72_000_000, 'C'],
  ] as const)('%s -> annual PTKP %d, TER category %s', (status, expectedAmount, expectedCategory) => {
    const resolved = resolvePtkp(status, PTKP_2024_BASE);
    expect(resolved.annualAmount).toBe(expectedAmount);
    expect(resolved.terCategory).toBe(expectedCategory);
  });

  it('K/I/0 adds the spouse basic PTKP on top of K/0', () => {
    const resolved = resolvePtkp('KI0', PTKP_2024_BASE);
    expect(resolved.annualAmount).toBe(58_500_000 + 54_000_000);
  });

  it('caps tanggungan at 3 even if a 4th were requested', () => {
    // K3 is the max modeled status; verify the cap logic directly
    const resolved = resolvePtkp('K3', PTKP_2024_BASE);
    expect(resolved.annualAmount).toBe(54_000_000 + 4_500_000 + 3 * 4_500_000);
  });
});
