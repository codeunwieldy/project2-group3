/**
 * Import script for Bellini Classes F25.xlsx
 * Fall 2025 data (25 columns, 153 rows)
 *
 * Run from project root: npm run import:f25
 */
import path from 'path'
import {
  readSheet,
  parseTimeRange,
  parseExcelDate,
  upsertLookup,
  upsertInstructor,
  upsertCourse,
  normalizeCourseLevel,
  supabaseAdmin,
} from './import-utils'

// F25 Column → field mapping (25 columns, SPACES not underscores):
// TERM, CAMPUS, CRSE LEVL, CRSE SECTION, CRN, SUBJ, CRSE NUMB, CRSE TITLE,
// ENROLLMENT, TA Hours, UGTAs, UGTA Emails, Grad TAS, PRIOR SECT ENRL,
// WAIT LIST ACTUAL, WAIT LIST MAX, START DATE, END DATE, MULTIPLE SECTIONS,
// Grad TA Emails, MEETING DAYS, MEETING TIMES1, MEETING ROOM, INSTRUCTOR, INSTRUCTOR EMAIL

interface F25Row {
  TERM?: string
  CAMPUS?: string
  'CRSE LEVL'?: string
  'CRSE SECTION'?: string | number
  CRN?: string | number
  SUBJ?: string
  'CRSE NUMB'?: string | number
  'CRSE TITLE'?: string
  ENROLLMENT?: number | string
  'TA Hours'?: number | string
  UGTAs?: string
  'UGTA Emails'?: string
  'Grad TAS'?: string
  'PRIOR SECT ENRL'?: number | string
  'WAIT LIST ACTUAL'?: number | string
  'WAIT LIST MAX'?: number | string
  'START DATE'?: number | string
  'END DATE'?: number | string
  'MULTIPLE SECTIONS'?: string
  'Grad TA Emails'?: string
  'MEETING DAYS'?: string
  'MEETING TIMES1'?: string
  'MEETING ROOM'?: string
  INSTRUCTOR?: string
  'INSTRUCTOR EMAIL'?: string
}

/**
 * Split a cell that may use \r\n, \n, or commas as delimiters.
 */
function splitMultiValue(cell: string | null | undefined): string[] {
  if (!cell) return []
  return String(cell)
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Parse F25 TA format: "Shrestha Datta (20)\r\nNithish Reddy Gade (10)"
 * or "Name (hours)" separated by newlines/spaces, or comma-separated.
 */
function parseF25TAs(
  cell: string | null | undefined,
  emailsCell: string | null | undefined
): { name: string; hours: number | null; email: string | null }[] {
  if (!cell) return []
  const str = String(cell).trim()
  if (!str || str === 'NA' || str === 'N/A' || str === 'See COP') return []

  const results: { name: string; hours: number | null; email: string | null }[] = []
  const emailList = splitMultiValue(emailsCell)

  // Pattern: one or more name tokens followed by (hours)
  // e.g., "Shrestha Datta (20)" or "Nithish Reddy Gade (10)"
  const pattern = /([A-Za-z][A-Za-z\s\-']+?)\s*\((\d+)\)/g
  let match
  let idx = 0
  while ((match = pattern.exec(str)) !== null) {
    const name = match[1].trim()
    const hours = parseInt(match[2], 10)
    const email = emailList[idx] ?? null
    results.push({ name, hours, email })
    idx++
  }

  if (results.length > 0) return results

  // Fallback: newline or comma-separated names without hours
  const names = splitMultiValue(str)
  return names.map((name, i) => ({
    name,
    hours: null,
    email: emailList[i] ?? null,
  }))
}

async function upsertF25TAs(
  sectionId: number,
  cell: string | null | undefined,
  emailsCell: string | null | undefined,
  taType: 'GRAD' | 'UGTA'
) {
  const tas = parseF25TAs(cell, emailsCell)
  if (tas.length === 0) return

  for (const { name, hours, email } of tas) {
    const resolvedEmail = email
      ? email.toLowerCase()
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@bellini-ta-placeholder.edu`

    const { data: ta, error: taError } = await supabaseAdmin
      .from('tas')
      .upsert(
        { email: resolvedEmail, full_name: name, ta_type: taType },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (taError) {
      console.warn(`  TA upsert failed for ${name}:`, taError.message)
      continue
    }

    const { error: assignError } = await supabaseAdmin
      .from('ta_assignments')
      .upsert(
        { section_id: sectionId, ta_id: ta.id, hours: hours ?? null },
        { onConflict: 'section_id,ta_id' }
      )

    if (assignError) {
      console.warn(`  TA assignment failed for ${name}:`, assignError.message)
    }
  }
}

async function importF25() {
  console.log('=== Importing Fall 2025 (F25) ===')
  const filePath = path.resolve(process.cwd(), '..', 'Bellini Classes F25.xlsx')
  const rows = readSheet(filePath) as F25Row[]
  console.log(`Read ${rows.length} rows from ${filePath}`)

  // Ensure F25 semester exists
  await supabaseAdmin
    .from('semesters')
    .upsert(
      { code: 'F25', term_label: 'Fall 2025', term_code: '202508' },
      { onConflict: 'code' }
    )
  const { data: sem } = await supabaseAdmin
    .from('semesters')
    .select('id')
    .eq('code', 'F25')
    .single()
  const semesterId = sem!.id
  console.log(`Semester F25 id = ${semesterId}`)

  let imported = 0
  let failed = 0

  for (const row of rows) {
    const crn = row.CRN ? String(row.CRN).trim() : null
    if (!crn) { console.warn('  Skipping row with no CRN'); failed++; continue }

    // Upsert lookups
    const subjectId = await upsertLookup('subjects', 'code', row.SUBJ)
    if (!subjectId) { console.warn(`  Skipping CRN ${crn}: no subject`); failed++; continue }

    const courseId = await upsertCourse(
      subjectId,
      row['CRSE NUMB'] ? String(row['CRSE NUMB']) : null,
      row['CRSE TITLE'],
      row['CRSE LEVL']
    )
    if (!courseId) { console.warn(`  Skipping CRN ${crn}: no course`); failed++; continue }

    const roomId = await upsertLookup('rooms', 'room_code', row['MEETING ROOM'])
    const instructorId = await upsertInstructor(row.INSTRUCTOR, row['INSTRUCTOR EMAIL'])

    // Campus
    let campusId: number | null = null
    if (row.CAMPUS) {
      const campusCode = String(row.CAMPUS).trim().toUpperCase().replace(/\s+/g, '_')
      campusId = await upsertLookup('campuses', 'code', campusCode)
    }

    const { start, end } = parseTimeRange(row['MEETING TIMES1'])
    const enrollment = row.ENROLLMENT ? parseInt(String(row.ENROLLMENT), 10) : null
    const priorEnrl = row['PRIOR SECT ENRL'] ? parseInt(String(row['PRIOR SECT ENRL']), 10) : null
    const waitListActual = row['WAIT LIST ACTUAL'] ? parseInt(String(row['WAIT LIST ACTUAL']), 10) : null
    const waitListMax = row['WAIT LIST MAX'] ? parseInt(String(row['WAIT LIST MAX']), 10) : null

    const startDate = parseExcelDate(row['START DATE'])
    const endDate = parseExcelDate(row['END DATE'])

    // Upsert section
    const { data: section, error: sectionError } = await supabaseAdmin
      .from('sections')
      .upsert(
        {
          semester_id: semesterId,
          campus_id: campusId,
          course_id: courseId,
          crn,
          section_code: row['CRSE SECTION'] ? String(row['CRSE SECTION']) : '001',
          course_level: normalizeCourseLevel(row['CRSE LEVL']),
          meeting_days: row['MEETING DAYS'] ?? null,
          meeting_times: row['MEETING TIMES1'] ?? null,
          meeting_time_start: start,
          meeting_time_end: end,
          room_id: roomId,
          instructor_id: instructorId,
          enrollment: isNaN(enrollment ?? NaN) ? null : enrollment,
          prior_section_enrollment: isNaN(priorEnrl ?? NaN) ? null : priorEnrl,
          wait_list_actual: isNaN(waitListActual ?? NaN) ? null : waitListActual,
          wait_list_max: isNaN(waitListMax ?? NaN) ? null : waitListMax,
          multiple_sections: row['MULTIPLE SECTIONS'] ?? null,
          start_date: startDate,
          end_date: endDate,
        },
        { onConflict: 'semester_id,crn' }
      )
      .select('id')
      .single()

    if (sectionError || !section) {
      console.warn(`  Section upsert failed for CRN ${crn}:`, sectionError?.message)
      failed++
      continue
    }

    // Upsert TAs
    await upsertF25TAs(section.id, row['Grad TAS'], row['Grad TA Emails'], 'GRAD')
    await upsertF25TAs(section.id, row.UGTAs, row['UGTA Emails'], 'UGTA')

    imported++
    if (imported % 10 === 0) console.log(`  Imported ${imported}/${rows.length} rows...`)
  }

  console.log(`\nF25 Import complete: ${imported} imported, ${failed} failed`)
}

importF25().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
