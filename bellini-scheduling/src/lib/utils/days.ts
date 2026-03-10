/**
 * Expands a meeting days string into an array of day codes.
 * e.g., "MWF" → ["M", "W", "F"]
 * e.g., "TR" → ["T", "R"]
 */
export const DAY_CODES = ['M', 'T', 'W', 'R', 'F', 'S', 'U'] as const
export type DayCode = (typeof DAY_CODES)[number]

export const DAY_LABELS: Record<DayCode, string> = {
  M: 'Monday',
  T: 'Tuesday',
  W: 'Wednesday',
  R: 'Thursday',
  F: 'Friday',
  S: 'Saturday',
  U: 'Sunday',
}

export const DAY_SHORT: Record<DayCode, string> = {
  M: 'Mon',
  T: 'Tue',
  W: 'Wed',
  R: 'Thu',
  F: 'Fri',
  S: 'Sat',
  U: 'Sun',
}

export function expandDays(daysStr: string | null | undefined): DayCode[] {
  if (!daysStr) return []
  return (daysStr.split('') as DayCode[]).filter((d) => DAY_CODES.includes(d))
}

export function dayIntersects(days1: string | null, days2: string | null): boolean {
  if (!days1 || !days2) return false
  const set1 = new Set(expandDays(days1))
  return expandDays(days2).some((d) => set1.has(d))
}
