import type { PtkpStatus, TerCategory } from '../constants/types.js';

export interface BreakdownLine {
  label: string;
  amount: number;
}

export type CalculationMethod = 'ter-bulanan' | 'ter-harian' | 'pasal-17' | 'final';

export interface PPh21Result {
  /** Final withholding for this calculation, rounded down to whole rupiah. Can be negative for a December over-withholding refund. */
  pph21: number;
  /** Present only when a DTP incentive applies: the tax amount before the government-borne offset. */
  pph21BeforeDtp?: number;
  /** Present only when a DTP incentive applies: the amount paid to the employee as cash under PMK 105/2025. */
  dtpAmount?: number;
  /** Dasar Pengenaan Pajak — the taxable base this calculation's rate/brackets were applied to. */
  dpp: number;
  method: CalculationMethod;
  ter?: { category: TerCategory; rate: number };
  breakdown: BreakdownLine[];
  ptkp?: { status: PtkpStatus; annualAmount: number };
  npwpSurchargeApplied: boolean;
  regulation: string;
}
