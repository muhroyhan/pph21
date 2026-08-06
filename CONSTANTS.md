# Updating tax constants

Indonesian PPh 21 regulation changes periodically (a new PTKP, a revised TER
table, a new Article 17 bracket, a new BPJS ceiling, a new incentive like
PMK 105/2025). This package is designed so a policy change is a **data edit
in `src/constants/`**, never a change to calculation logic.

## Where to look

| Regulation changes... | Edit this file |
|---|---|
| PTKP amounts, marital/dependent status mapping | `src/constants/ptkp.ts` |
| Article 17 progressive brackets | `src/constants/article17.ts` |
| TER A/B/C or TER Harian tables | `src/constants/ter.ts` |
| Biaya jabatan / biaya pensiun rate or cap | `src/constants/deductions.ts` |
| BPJS rates or wage ceilings | `src/constants/bpjs.ts` |
| Pesangon / JHT-JP lump sum final tax brackets | `src/constants/final-tax.ts` |
| A DTP-style incentive (like PMK 105/2025) | `src/constants/dtp.ts` |
| **Wiring a new tax year together** | `src/constants/tax-years.ts` |

## How to add a new tax year

1. Add or edit the relevant table(s) above. If a table is unchanged from the
   prior year, reuse the existing export — don't duplicate it.
2. In `src/constants/tax-years.ts`, add a new entry to `TAX_YEAR_CONFIGS`
   keyed by year. Copy the previous year's config forward and override only
   what changed — never mutate a past year's entry in place, since old
   payroll runs should stay reproducible against the figures that were
   actually in force at the time.
3. Update `LATEST_TAX_YEAR` if the new year should be the default.
4. Update `regulations` in that year's config with the citing PMK/PP/UU.
5. Add the table-integrity assertions for any new bracket table (see
   `test/ter-tables.test.ts` for the pattern: non-decreasing rates,
   contiguous boundaries, correct bracket count).
6. If you have an official worked example (DJP's own Lampiran examples are
   ideal), add it as a golden test — see `test/pegawai-tetap.test.ts`.

## A note on the BPJS JP wage ceiling

Unlike tax-year constants, the BPJS Ketenagakerjaan JP wage ceiling has
historically been adjusted **each March**, independent of the calendar tax
year. It is modeled as an effective-dated list in `src/constants/bpjs.ts`
(`jp.wageCeilings`) rather than folded into `TAX_YEAR_CONFIGS` — add a new
`{ effectiveFrom, amount }` entry rather than replacing the list.

## Verifying a change

Regenerate confidence the same way this package's initial tables were
verified — against the **official PMK/PP PDF**, not a blog or calculator
site (two independent secondary sources consulted while building this
package had silently wrong TER B/C tables). Then:

```bash
npm test        # table-integrity + golden-case regression tests
npm run build   # confirm it still compiles
```
