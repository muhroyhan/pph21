/**
 * PMK 168/2023 Pasal 20: employees without an NPWP (or an NIK not yet
 * validated as an NPWP) are withheld at 120% of the normal PPh 21 amount.
 * Applied last, after the base tax has been fully computed.
 */
export function applyNpwpSurcharge(baseTax: number, hasNpwp: boolean, multiplier: number): number {
  return hasNpwp ? baseTax : baseTax * multiplier;
}
