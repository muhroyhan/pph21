# Changelog

## 1.0.0

Initial release.

- `pegawai-tetap`, `pegawai-tidak-tetap`, `bukan-pegawai`, `peserta-kegiatan`,
  `dewan-komisaris`, `mantan-pegawai`, `penerima-pensiun-berkala`,
  `penarikan-dana-pensiun-awal`, and `penghasilan-final` calculators.
- PTKP, Article 17, TER A/B/C/Harian tables transcribed and verified against
  the official PMK 168/2023 PDF.
- BPJS Ketenagakerjaan (JKK/JKM/JHT/JP) and BPJS Kesehatan premium
  calculation with taxability/deductibility flags per component.
- PMK 105/2025 PPh 21 DTP 2026 incentive support.
- Tax years 2024–2026 configured in `src/constants/tax-years.ts`.
