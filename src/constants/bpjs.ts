import type { BpjsConfig } from './types.js';

/**
 * BPJS Ketenagakerjaan (PP 44/2015, PP 82/2019) + BPJS Kesehatan (Perpres 63/2022).
 * JKK is risk-graded (employer picks the tier matching their business classification —
 * not derivable from tax data alone, so the caller supplies it).
 * JP wage ceiling is adjusted by BPJS Ketenagakerjaan periodically (historically each
 * March), independent of the tax-year boundary — hence the effective-dated list.
 */
export const BPJS_2024: BpjsConfig = {
  jkk: {
    tiers: [
      { label: 'very-low', rate: 0.0024 },
      { label: 'low', rate: 0.0054 },
      { label: 'medium', rate: 0.0089 },
      { label: 'high', rate: 0.0127 },
      { label: 'very-high', rate: 0.0174 },
    ],
  },
  jkm: { employerRate: 0.003 },
  jht: { employerRate: 0.037, employeeRate: 0.02 },
  jp: {
    employerRate: 0.02,
    employeeRate: 0.01,
    wageCeilings: [
      { effectiveFrom: '2024-01-01', amount: 10_042_300 },
      { effectiveFrom: '2025-03-01', amount: 10_547_400 },
      { effectiveFrom: '2026-03-01', amount: 11_086_300 },
    ],
  },
  kesehatan: {
    employerRate: 0.04,
    employeeRate: 0.01,
    wageCeiling: 12_000_000,
  },
};
