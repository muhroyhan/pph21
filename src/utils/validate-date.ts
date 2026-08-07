import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import type { IsoDateString, IsoMonthString } from '../constants/types.js';

dayjs.extend(customParseFormat);

/** True only for real calendar dates in strict `YYYY-MM-DD` format (rejects e.g. `2026-02-30`). */
export function isIsoDateString(value: string): value is IsoDateString {
  return dayjs(value, 'YYYY-MM-DD', true).isValid();
}

/** True only for real calendar months in strict `YYYY-MM` format (rejects e.g. `2026-13`). */
export function isIsoMonthString(value: string): value is IsoMonthString {
  return dayjs(value, 'YYYY-MM', true).isValid();
}

/** Throws with a descriptive message unless `value` is a valid `YYYY-MM-DD` date. */
export function assertIsoDateString(value: string, fieldName: string): asserts value is IsoDateString {
  if (!isIsoDateString(value)) {
    throw new Error(`Invalid ${fieldName}: "${value}" is not a real calendar date in YYYY-MM-DD format.`);
  }
}

/** Throws with a descriptive message unless `value` is a valid `YYYY-MM` month. */
export function assertIsoMonthString(value: string, fieldName: string): asserts value is IsoMonthString {
  if (!isIsoMonthString(value)) {
    throw new Error(`Invalid ${fieldName}: "${value}" is not a real calendar month in YYYY-MM format.`);
  }
}
