import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date-only values ('YYYY-MM-DD', which is how agreements.start_date and
// end_date come back) must never go through `new Date('2026-11-24')`: that
// parses as UTC midnight, so west of UTC the day compares and renders as the
// previous local day — a rental ending today would show as overdue, and one
// starting today would not be counted. These helpers anchor date-only
// strings to local midnight instead.

/** Today as a local 'YYYY-MM-DD' string, for comparing against stored dates. */
export function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** First 10 characters of a date or timestamp: the 'YYYY-MM-DD' part. */
export function dateOnly(value: string): string {
  return value.slice(0, 10)
}

/** Parse a date-only string as local midnight (not UTC). */
export function parseDateOnly(value: string): Date {
  return new Date(`${dateOnly(value)}T00:00:00`)
}
