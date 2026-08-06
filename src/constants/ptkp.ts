import type { PtkpConfig, PtkpStatus, TerCategory } from './types.js';

/**
 * PMK 101/PMK.010/2016. Unchanged since 2016; still current as of 2026.
 * Annual PTKP = base + (kawin ? kawin : 0) + tanggungan * tanggunganPerOrang (max 3 tanggungan).
 */
export const PTKP_2024_BASE: PtkpConfig = {
  base: 54_000_000,
  kawin: 4_500_000,
  tanggunganPerOrang: 4_500_000,
  maxTanggungan: 3,
  // PMK 168/2023 Lampiran (Halaman 9-12): TER category assigned per PTKP status.
  // KI/* (combined spousal income) uses the same TER category as its non-combined
  // counterpart for monthly withholding; the KI-specific PTKP amount only affects
  // the annual reconciliation in the final tax period — see resolve-ptkp.ts.
  terCategoryByStatus: {
    TK0: 'A',
    TK1: 'A',
    K0: 'A',
    TK2: 'B',
    TK3: 'B',
    K1: 'B',
    K2: 'B',
    K3: 'C',
    KI0: 'A',
    KI1: 'B',
    KI2: 'B',
    KI3: 'C',
  } satisfies Record<PtkpStatus, TerCategory>,
};

/**
 * K/I/n (combined spousal income) adds the spouse's own basic PTKP (`base`)
 * on top of the ordinary K/n amount — e.g. K/I/0 = K/0 + 54jt = 112,5jt.
 */
export function annualPtkpAmount(status: PtkpStatus, config: PtkpConfig): number {
  const isKombinasi = status.startsWith('KI');
  const isKawin = isKombinasi || status.startsWith('K');
  const tanggungan = Math.min(
    Number(status.slice(-1)),
    config.maxTanggungan,
  );
  return (
    config.base +
    (isKawin ? config.kawin : 0) +
    tanggungan * config.tanggunganPerOrang +
    (isKombinasi ? config.base : 0)
  );
}
