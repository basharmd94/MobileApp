/**
 * Shared date helpers for the delivery / payment flow.
 *
 * All inputs are ISO-ish date strings (YYYY-MM-DD). Times are ignored —
 * we only compare calendar days, so we work with UTC midnight to avoid
 * timezone drift on the mobile WebView.
 */

/** Convert a YYYY-MM-DD string to a UTC midnight Date. Returns NaN if invalid. */
function toUtcDay(value: string): number {
  if (!value || typeof value !== 'string') return NaN;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return NaN;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return ts;
}

/** True when both values are valid YYYY-MM-DD and `a` is the same day as `b`. */
export function isSameDay(a: string, b: string): boolean {
  const ta = toUtcDay(a);
  const tb = toUtcDay(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return ta === tb;
}

/** True when `a` is strictly before `b` (calendar day, ignores time). */
export function isBeforeDay(a: string, b: string): boolean {
  const ta = toUtcDay(a);
  const tb = toUtcDay(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return ta < tb;
}

/** True when `a` is on or before `b`. */
export function isOnOrBeforeDay(a: string, b: string): boolean {
  const ta = toUtcDay(a);
  const tb = toUtcDay(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return ta <= tb;
}

/** True when `a` is on or after `b`. */
export function isOnOrAfterDay(a: string, b: string): boolean {
  const ta = toUtcDay(a);
  const tb = toUtcDay(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return ta >= tb;
}

/** Today's date as YYYY-MM-DD (local). */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Friendly label: "Today", "Yesterday", "Tomorrow", or the date string. */
export function humanizeDate(value: string): string {
  if (!value) return '';
  if (isSameDay(value, todayIso())) return 'Today';
  if (isSameDay(value, isoAddDays(todayIso(), -1))) return 'Yesterday';
  if (isSameDay(value, isoAddDays(todayIso(), 1))) return 'Tomorrow';
  return value;
}

function isoAddDays(iso: string, delta: number): string {
  const ta = toUtcDay(iso);
  if (Number.isNaN(ta)) return '';
  const d = new Date(ta);
  d.setUTCDate(d.getUTCDate() + delta);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
