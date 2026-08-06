import type { PtkpConfig, PtkpStatus, TerCategory } from '../constants/types.js';
import { annualPtkpAmount } from '../constants/ptkp.js';

export interface ResolvedPtkp {
  status: PtkpStatus;
  annualAmount: number;
  terCategory: TerCategory;
}

export function resolvePtkp(status: PtkpStatus, config: PtkpConfig): ResolvedPtkp {
  return {
    status,
    annualAmount: annualPtkpAmount(status, config),
    terCategory: config.terCategoryByStatus[status],
  };
}
