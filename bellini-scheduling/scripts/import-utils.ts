import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Reads the first sheet of an Excel file and returns rows as plain objects.
 */
export function readSheet(filePath: string): Record<string, unknown>[] {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[]
}

/**
 * Parse time range strings to PostgreSQL TIME format.
 * Handles: "09:30-10:45", "0930-1045", "11:00 AM - 01:45 PM", "TBA", etc.
 */
export function parseTimeRange(timeStr: string | null | undefined): {
  start: string | null
  end: string | null
} {
  if (!timeStr || /^(TBA|ARR|ONLINE|TBD)$/i.test(String(timeStr).trim())) {
    return { start: null, end: null }
  }

  const s = String(timeStr).trim()

  // Format: "11:00 AM - 01:45 PM"
  const ampmMatch = s.match(
    /(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)/i
  )
  if (ampmMatch) {
    return {
      start: convertTo24Hour(ampmMatch[1].trim()),
      end: convertTo24Hour(ampmMatch[2].trim()),
    }
  }

  // Format: "0930-1045" (4+4 digits)
  const compactMatch = s.match(/^(\d{4})\s*[-–]\s*(\d{4})$/)
  if (compactMatch) {
    return {
      start: `${compactMatch[1].slice(0, 2)}:${compactMatch[1].slice(2)}`,
      end: `${compactMatch[2].slice(0, 2)}:${compactMatch[2].slice(2)}`,
    }
  }

  // Format: "09:30-10:45"
  const colonMatch = s.match(/^(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/)
  if (colonMatch) {
    return {
      start: `${colonMatch[1]}:${colonMatch[2]}`,
      end: `${colonMatch[3]}:${colonMatch[4]}`,
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
 * Normalize CRSE_LEVL values to the database enum.
 */
export function normalizeCourseLevel(
  level: string | null | undefined
): 'UG' | 'GR' | 'UGRD' | 'GRAD' | null {
  if (!level) return null
  const l = String(level).trim().toUpperCase()
  if (l === 'UG' || l === 'UGRD' || l === 'UNDERGRADUATE') return 'UG'
  if (l === 'GR' || l === 'GRAD' || l === 'GRADUATE') return 'GR'
  return null
}

/**
 * Upsert a row into a reference/lookup table by a unique field.
 * Returns the row's id.
 */
export async function upsertLookup(
  table: string,
  matchField: string,
  value: string | null | undefined
): Promise<number | null> {
  if (!value || String(value).trim() === '') return null
  const cleanValue = String(value).trim()
  const { data, error } = await supabaseAdmin
    .from(table)
    .upsert({ [matchField]: cleanValue }, { onConflict: matchField })
    .select('id')
    .single()
  if (error) {
    console.error(`upsertLookup(${table}, ${matchField}=${cleanValue}) failed:`, error.message)
    return null
  }
  return data?.id ?? null
}

/**
 * Upsert an instructor by email. Falls back to name-based lookup if no email.
 */
export async function upsertInstructor(
  name: string | null | undefined,
  email: string | null | undefined
): Promise<number | null> {
  if (!email && !name) return null

  // Normalize email; if missing, synthesize one from name
  const resolvedEmail = email
    ? String(email).trim().toLowerCase()
    : `${String(name).trim().toLowerCase().replace(/\s+/g, '.')}@bellini-unknown.edu`

  const { data, error } = await supabaseAdmin
    .from('instructors')
    .upsert(
      { email: resolvedEmail, full_name: name ? String(name).trim() : null },
      { onConflict: 'email' }
    )
    .select('id')
    .single()

  if (error) {
    console.error(`upsertInstructor(${name}, ${email}) failed:`, error.message)
    return null
  }
  return data?.id ?? null
}

/**
 * Upsert a course record. Returns course id.
 */
export async function upsertCourse(
  subjectId: number,
  courseNumber: string | null | undefined,
  title: string | null | undefined,
  courseLevel: string | null | undefined
): Promise<number | null> {
  if (!subjectId || !courseNumber) return null
  const { data, error } = await supabaseAdmin
    .from('courses')
    .upsert(
      {
        subject_id: subjectId,
        course_number: String(courseNumber).trim(),
        title: title ? String(title).trim() : 'Unknown',
        course_level: normalizeCourseLevel(courseLevel),
      },
      { onConflict: 'subject_id,course_number' }
    )
    .select('id')
    .single()

  if (error) {
    console.error(`upsertCourse(${subjectId}, ${courseNumber}) failed:`, error.message)
    return null
  }
  return data?.id ?? null
}

/**
 * Parse an Excel date serial number to ISO date string.
 */
export function parseExcelDate(val: number | string | null | undefined): string | null {
  if (!val) return null
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
  }
  // Excel serial number
  const date = XLSX.SSF.parse_date_code(val as number)
  if (!date) return null
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
}
