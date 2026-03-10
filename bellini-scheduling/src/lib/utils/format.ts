/**
 * Format a percentage value for display.
 * e.g., 12.5 → "+12.5%"
 */
export function formatPct(value: number | null | undefined, showSign = true): string {
  if (value == null) return 'N/A'
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Format an enrollment number or return a dash.
 */
export function formatEnrollment(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

/**
 * Format hours to a readable string.
 */
export function formatHours(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value}h`
}

/**
 * Format a time string like "09:30" to "9:30 AM".
 */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return 'TBA'
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return timeStr
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Format a time range.
 */
export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start || !end) return 'TBA'
  return `${formatTime(start)} – ${formatTime(end)}`
}

/**
 * Truncate a string to a max length.
 */
export function truncate(str: string | null | undefined, maxLen = 50): string {
  if (!str) return ''
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
