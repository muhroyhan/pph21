/** A closed [min, max] bracket. `max: null` means "and above" (open-ended). */
export interface Bracket {
  min: number;
  max: number | null;
  rate: number;
}

export type TerCategory = 'A' | 'B' | 'C';

export type MaritalStatus = 'TK' | 'K';

/**
 * PTKP status, e.g. TK0, TK1, TK2, TK3, K0, K1, K2, K3, KI0, KI1, KI2, KI3.
 * KI = kawin dengan penghasilan istri digabung (combined-income spouse).
 */
export type PtkpStatus =
  | 'TK0' | 'TK1' | 'TK2' | 'TK3'
  | 'K0' | 'K1' | 'K2' | 'K3'
  | 'KI0' | 'KI1' | 'KI2' | 'KI3';

export interface PtkpConfig {
  base: number;
  kawin: number;
  tanggunganPerOrang: number;
  maxTanggungan: number;
  /** PMK 168/2023 Lampiran: TER category per PTKP status (KI shares its non-combined K status). */
  terCategoryByStatus: Record<PtkpStatus, TerCategory>;
}

export interface DeductionsConfig {
  biayaJabatanRate: number;
  biayaJabatanMonthlyCap: number;
  biayaJabatanYearlyCap: number;
  biayaPensiunRate: number;
  biayaPensiunMonthlyCap: number;
  biayaPensiunYearlyCap: number;
}

export interface JpWageCeilingEntry {
  effectiveFrom: string; // ISO date, e.g. '2026-03-01'
  amount: number;
}

export interface JkkTier {
  label: string;
  rate: number;
}

export interface BpjsConfig {
  jkk: { tiers: JkkTier[] };
  jkm: { employerRate: number };
  jht: { employerRate: number; employeeRate: number };
  jp: { employerRate: number; employeeRate: number; wageCeilings: JpWageCeilingEntry[] };
  kesehatan: { employerRate: number; employeeRate: number; wageCeiling: number };
}

export interface DtpConfig {
  regulation: string;
  eligibleKbliSectors: string[];
  maxMonthlyGross: number;
  maxDailyWage: number;
  baselineMonth: string; // e.g. '2026-01'
}

export interface RegulationRefs {
  ptkp: string;
  article17: string;
  ter: string;
  finalTax: string;
  bpjs: string;
  dtp?: string;
}

export interface TaxYearConfig {
  year: number;
  ptkp: PtkpConfig;
  article17: Bracket[];
  ter: {
    A: Bracket[];
    B: Bracket[];
    C: Bracket[];
    harian: Bracket[];
  };
  deductions: DeductionsConfig;
  bpjs: BpjsConfig;
  finalTax: {
    pesangon: Bracket[];
    jhtJpLumpSum: Bracket[];
  };
  npwpSurchargeMultiplier: number;
  dtp?: DtpConfig;
  regulations: RegulationRefs;
}
