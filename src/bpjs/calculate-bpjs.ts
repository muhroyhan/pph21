import type { BpjsConfig, JkkTier } from '../constants/types.js';

export type JkkTierLabel = JkkTier['label'];

export interface BpjsInput {
  /** Monthly base wage used for BPJS contribution calculations (upah sebulan). */
  monthlyWage: number;
  jkkTier: JkkTierLabel;
  /** Payroll period date (ISO), used to resolve the JP wage ceiling in effect. */
  periodDate: string;
  /** Family size for BPJS Kesehatan is irrelevant to the premium — flat rate on wage up to ceiling. */
}

export interface BpjsComponent {
  label: string;
  employerAmount: number;
  employeeAmount: number;
  /** Whether this component's employer-paid portion is added to the employee's taxable gross. */
  employerPortionTaxable: boolean;
  /** Whether the employee-paid portion is deductible from the taxable base. */
  employeePortionDeductible: boolean;
}

export interface BpjsResult {
  components: BpjsComponent[];
  totalEmployer: number;
  totalEmployee: number;
  /** Sum of employer-paid portions that must be added to gross taxable income. */
  taxableAddition: number;
  /** Sum of employee-paid portions that are deductible from gross before PPh 21. */
  deductibleAmount: number;
}

function resolveWageCeiling(ceilings: BpjsConfig['jp']['wageCeilings'], periodDate: string): number {
  const applicable = ceilings
    .filter((c) => c.effectiveFrom <= periodDate)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  const latest = applicable[0];
  if (!latest) {
    throw new Error(
      `No JP wage ceiling is effective on or before ${periodDate}. Earliest known ceiling starts ${ceilings[0]?.effectiveFrom}.`,
    );
  }
  return latest.amount;
}

/**
 * Computes employer- and employee-paid BPJS Ketenagakerjaan (JKK, JKM, JHT,
 * JP) and BPJS Kesehatan premiums, tagged with the taxability flags PPh 21
 * calculators need: JKK/JKM/Kesehatan employer premiums are a taxable
 * benefit-in-kind to the employee; JHT/JP employer premiums are not; the
 * employee's own JHT/JP contributions are deductible from taxable income,
 * Kesehatan's is not.
 */
export function calculateBpjs(input: BpjsInput, config: BpjsConfig): BpjsResult {
  const jkkTier = config.jkk.tiers.find((t) => t.label === input.jkkTier);
  if (!jkkTier) {
    const available = config.jkk.tiers.map((t) => t.label).join(', ');
    throw new Error(`Unknown JKK tier "${input.jkkTier}". Available tiers: ${available}`);
  }

  const jpCeiling = resolveWageCeiling(config.jp.wageCeilings, input.periodDate);
  const jpBase = Math.min(input.monthlyWage, jpCeiling);
  const kesehatanBase = Math.min(input.monthlyWage, config.kesehatan.wageCeiling);

  const components: BpjsComponent[] = [
    {
      label: 'JKK',
      employerAmount: input.monthlyWage * jkkTier.rate,
      employeeAmount: 0,
      employerPortionTaxable: true,
      employeePortionDeductible: false,
    },
    {
      label: 'JKM',
      employerAmount: input.monthlyWage * config.jkm.employerRate,
      employeeAmount: 0,
      employerPortionTaxable: true,
      employeePortionDeductible: false,
    },
    {
      label: 'JHT',
      employerAmount: input.monthlyWage * config.jht.employerRate,
      employeeAmount: input.monthlyWage * config.jht.employeeRate,
      employerPortionTaxable: false,
      employeePortionDeductible: true,
    },
    {
      label: 'JP',
      employerAmount: jpBase * config.jp.employerRate,
      employeeAmount: jpBase * config.jp.employeeRate,
      employerPortionTaxable: false,
      employeePortionDeductible: true,
    },
    {
      label: 'Kesehatan',
      employerAmount: kesehatanBase * config.kesehatan.employerRate,
      employeeAmount: kesehatanBase * config.kesehatan.employeeRate,
      employerPortionTaxable: true,
      employeePortionDeductible: false,
    },
  ];

  const totalEmployer = components.reduce((sum, c) => sum + c.employerAmount, 0);
  const totalEmployee = components.reduce((sum, c) => sum + c.employeeAmount, 0);
  const taxableAddition = components
    .filter((c) => c.employerPortionTaxable)
    .reduce((sum, c) => sum + c.employerAmount, 0);
  const deductibleAmount = components
    .filter((c) => c.employeePortionDeductible)
    .reduce((sum, c) => sum + c.employeeAmount, 0);

  return { components, totalEmployer, totalEmployee, taxableAddition, deductibleAmount };
}
