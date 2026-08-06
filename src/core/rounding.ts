/**
 * DJP rounds the final withheld tax down to the nearest whole rupiah.
 * The tiny epsilon guards against binary floating-point error (e.g.
 * `5_000_000 * 0.15` evaluating to `749999.9999999999`) undershooting a
 * value that is mathematically a whole rupiah by one. It is far smaller
 * than any real fractional rupiah our rate tables can produce (minimum
 * step 0.0025), so it never masks a genuine fraction.
 */
export function roundDownRupiah(amount: number): number {
  return Math.floor(amount + 1e-6);
}

/** PKP (Penghasilan Kena Pajak) is rounded down to the nearest Rp1.000 before Article 17 is applied. */
export function roundDownToThousand(amount: number): number {
  return Math.floor(amount / 1000) * 1000;
}
