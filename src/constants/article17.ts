import type { Bracket } from './types.js';

/**
 * UU HPP 7/2021 Pasal 17 ayat (1) huruf a — verified against PMK 168/2023
 * Lampiran halaman 8. Unchanged since UU HPP took effect 2022.
 */
export const ARTICLE17_BRACKETS_2024: Bracket[] = [
  { min: 0, max: 60_000_000, rate: 0.05 },
  { min: 60_000_001, max: 250_000_000, rate: 0.15 },
  { min: 250_000_001, max: 500_000_000, rate: 0.25 },
  { min: 500_000_001, max: 5_000_000_000, rate: 0.3 },
  { min: 5_000_000_001, max: null, rate: 0.35 },
];
