# pph21

Indonesian employee income tax (**PPh Pasal 21**) calculator for Node.js and
the browser. Zero runtime dependencies. PTKP, TER (PMK 168/2023), Article 17,
BPJS, and the 2026 PPh 21 DTP incentive (PMK 105/2025) all ship as **internal,
versioned constants** — you never supply tax figures, only the facts of the
payroll event.

> **Disclaimer:** this package is a calculation aid, not tax advice. Verify
> results against official DJP guidance for your specific situation before
> relying on them for compliance.

## Install

```bash
npm install pph21
```

## Quick start

```ts
import { calculatePPh21 } from 'pph21';

const result = calculatePPh21({
  employeeType: 'pegawai-tetap',
  isFinalPeriod: false,
  ptkpStatus: 'K0',       // menikah, tanpa tanggungan
  hasNpwp: true,
  monthlyGrossIncome: 30_080_000,
});

console.log(result.pph21); // 3910400 — matches the DJP-published worked example
```

A single `employeeType` field selects which PMK 168/2023 rule set applies to
the calculation — TypeScript narrows the rest of the input to match.

## Employee types

| `employeeType` | Rule (PMK 168/2023) |
|---|---|
| `pegawai-tetap` | Permanent employee. Monthly: gross × TER Bulanan. Final month: (PKP setahun × Pasal 17) − tax withheld Jan–Nov. |
| `pegawai-tidak-tetap` | Non-permanent. Paid monthly → TER Bulanan. Daily ≤Rp2,5jt → TER Harian. Daily >Rp2,5jt → 50% × Pasal 17. |
| `bukan-pegawai` | Freelancer/professional honorarium. 50% × gross × Pasal 17, with optional cumulative DPP tracking. |
| `peserta-kegiatan` | Prize/competition income. Gross × Pasal 17, no PTKP or deduction. |
| `dewan-komisaris` | Non-employee commissioner's irregular honorarium. Gross × TER Bulanan. |
| `mantan-pegawai` | Bonus/tantiem/jasa produksi paid to a former employee. Gross × Pasal 17. |
| `penerima-pensiun-berkala` | Periodic pension. Same TER-monthly/Pasal-17-final structure as pegawai tetap, with biaya pensiun instead of biaya jabatan. |
| `penarikan-dana-pensiun-awal` | Active employee's early pension fund withdrawal. Gross × Pasal 17 (ordinary, not final). |
| `penghasilan-final` | Severance (`kind: 'pesangon'`) or JHT/JP lump-sum withdrawal (`kind: 'jht-jp-lump-sum'`) — final tax under PP 68/2009. |

## Every result is auditable

```ts
interface PPh21Result {
  pph21: number;               // final amount, rounded down to whole rupiah (can be negative — a December refund)
  pph21BeforeDtp?: number;     // present when the DTP incentive applies
  dtpAmount?: number;          // cash the employer pays the employee under PMK 105/2025
  dpp: number;                 // dasar pengenaan pajak this calculation used
  method: 'ter-bulanan' | 'ter-harian' | 'pasal-17' | 'final';
  ter?: { category: 'A' | 'B' | 'C'; rate: number };
  breakdown: { label: string; amount: number }[]; // line items, in bukti-potong order
  ptkp?: { status: string; annualAmount: number };
  npwpSurchargeApplied: boolean;
  regulation: string;          // the legal basis this figure rests on
}
```

## BPJS

```ts
import { calculateBpjs } from 'pph21';

const bpjs = calculateBpjs(
  { monthlyWage: 8_000_000, jkkTier: 'low', periodDate: '2026-03-15' },
  getTaxYearConfig(2026).bpjs,
);

bpjs.taxableAddition;   // employer JKK/JKM/Kesehatan premiums — add to taxable gross
bpjs.deductibleAmount;  // employee JHT/JP contributions — deduct from taxable income
```

Each component is tagged with whether its employer-paid portion is a taxable
benefit-in-kind and whether its employee-paid portion is deductible — this is
the part of BPJS math most payroll implementations get wrong.

## PMK 105/2025 — PPh 21 DTP 2026

```ts
calculatePPh21(input, {
  taxYear: 2026,
  dtp: { eligible: true, baselineMonthlyGross: 8_000_000 },
});
```

Only takes effect for tax year 2026, only for employees whose income in the
baseline month (January 2026, or first month worked) was ≤Rp10.000.000. When
it applies, `pph21` is zeroed out and the amount moves to `dtpAmount` — cash
the employer pays the employee directly instead of remitting it.

## Choosing a tax year

```ts
calculatePPh21(input, { taxYear: 2025 }); // defaults to the latest supported year
```

## When the government changes the rules

All statutory figures live in `src/constants/`, keyed by tax year in
`src/constants/tax-years.ts`. See **[CONSTANTS.md](./CONSTANTS.md)** for
exactly which file to edit for a given regulation change, and how to verify
the update.

## Out of scope (for now)

- PPh 26 (non-resident expatriates)
- e-Bupot 21/26 XML generation
- Multi-employer year-end consolidation
- Cumulative monthly-wage tracking for daily-paid non-permanent workers (each
  daily payment is calculated independently, per the official formula)

## License

MIT
