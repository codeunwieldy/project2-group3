/**
 * Parses meeting time strings from Excel into start/end TIME values.
 * Handles formats:
 *   - "09:30-10:45"
 *   - "0930-1045"
 *   - "11:00 AM - 01:45 PM"
 *   - "TBA" / "ARR" / null
 */
export function parseTimeRange(timeStr: string | null | undefined): {
  start: string | null
  end: string | null
} {
  if (!timeStr || /^(TBA|ARR|ONLINE)$/i.test(timeStr.trim())) {
    return { start: null, end: null }
  }

  // Format: "11:00 AM - 01:45 PM"
  const ampmMatch = timeStr.match(
    /(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)/i
  )
  if (ampmMatch) {
    return {
      start: convertTo24Hour(ampmMatch[1].trim()),
      end: convertTo24Hour(ampmMatch[2].trim()),
    }
  }

  // Format: "09:30-10:45" or "0930-1045"
  const simpleMatch = timeStr.match(/(\d{2,4}):?(\d{0,2})\s*[-–]\s*(\d{2,4}):?(\d{0,2})/)
  if (simpleMatch) {
    const startH = simpleMatch[1].padStart(2, '0')
    const startM = simpleMatch[2] ? simpleMatch[2].padStart(2, '0') : '00'
    const endH = simpleMatch[3].padStart(2, '0')
    const endM = simpleMatch[4] ? simpleMatch[4].padStart(2, '0') : '00'

    // Handle 4-digit format like "0930"
    if (simpleMatch[1].length === 4) {
      return {
        start: `${simpleMatch[1].slice(0, 2)}:${simpleMatch[1].slice(2)}`,
        end: `${simpleMatch[3].slice(0, 2)}:${simpleMatch[3].slice(2)}`,
      }
    }

    return {
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
    }
  }

  return { start: null, end: null }
}

function convertTo24Hour(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i)
  if (!match) return timeStr

  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const meridiem = match[3].toUpperCase()

  if (meridiem === 'AM' && hours === 12) hours = 0
  if (meridiem === 'PM' && hours !== 12) hours += 12

  return `${String(hours).padStart(2, '0')}:${minutes}`
}

/**
 * Normalizes meeting days string to a canonical format.
 * e.g., "MWF", "TR", "M W F", "T R" → "MWF", "TR"
 */
export function normalizeMeetingDays(daysStr: string | null | undefined): string | null {
  if (!daysStr) return null
  const cleaned = daysStr.trim().toUpperCase().replace(/\s+/g, '')
  if (!cleaned || /^(TBA|ARR|ONLINE)$/.test(cleaned)) return null
  return cleaned
}

/**
 * Checks whether two time ranges overlap.
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2
}

/**
 * Generates 30-minute time slots from startHour to endHour.
 * e.g., generateTimeSlots(7, 22) → ["07:00", "07:30", "08:00", ...]
 */
export function generateTimeSlots(startHour = 7, endHour = 22): string[] {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}
