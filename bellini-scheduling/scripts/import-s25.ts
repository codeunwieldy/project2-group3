/**
 * Import script for Bellini Classes S25.xlsx
 * Spring 2025 data (16 columns, 118 rows)
 *
 * Run from project root: npm run import:s25
 */
import path from 'path'
import {
  readSheet,
  parseTimeRange,
  upsertLookup,
  upsertInstructor,
  upsertCourse,
  normalizeCourseLevel,
  supabaseAdmin,
} from './import-utils'

// S25 Column → field mapping:
// TERM, CRSE_LEVL, CRSE_SECTION, CRN, SUBJ, CRSE_NUMB, CRSE_TITLE,
// Grad Hours, Graduate TA(s), UG Hours, UGTA(s),
// MEETING_DAYS, MEETING_TIMES, MEETING_ROOM, INSTRUCTOR, INSTRUCTOR EMAIL

interface S25Row {
  TERM?: string
  CRSE_LEVL?: string
  CRSE_SECTION?: string | number
  CRN?: string | number
  SUBJ?: string
  CRSE_NUMB?: string | number
  CRSE_TITLE?: string
  'Grad Hours'?: number | string
  'Graduate TA(s)'?: string
  'UG Hours'?: number | string
  'UGTA(s)'?: string
  MEETING_DAYS?: string
  MEETING_TIMES?: string
  MEETING_ROOM?: string
  INSTRUCTOR?: string
  'INSTRUCTOR EMAIL'?: string
}

/**
 * Parse TA names from a cell value like:
 * "Christopher Morris (10), Nafis Azad (10), Theophilus Amaefuna (10)"
 * or plain "Christopher Morris, Nafis Azad"
 * Returns array of { name, hours }
 */
function parseTACell(
  cell: string | null | undefined,
  totalHours: number | null
): { name: string; hours: number | null }[] {
  if (!cell) return []
  const str = String(cell).trim()
  if (!str || str === 'NA' || str === 'N/A') return []

  const results: { name: string; hours: number | null }[] = []

  // Pattern: "Name (hours)" possibly repeated
  const hoursPattern = /([A-Za-z][\w\s\-']+?)\s*\((\d+)\)/g
  let match
  while ((match = hoursPattern.exec(str)) !== null) {
    results.push({ name: match[1].trim(), hours: parseInt(match[2], 10) })
  }

  if (results.length > 0) return results

  // Fallback: comma-separated names without hours
  const names = str.split(',').map((n) => n.trim()).filter(Boolean)
  const hoursEach = totalHours && names.length > 0
    ? Math.round(totalHours / names.length)
    : null
  return names.map((name) => ({ name, hours: hoursEach }))
}

async function upsertTAs(
  sectionId: number,
  cell: string | null | undefined,
  totalHours: number | string | null | undefined,
  taType: 'GRAD' | 'UGTA',
  emailsCell?: string | null
) {
  const total = totalHours ? parseFloat(String(totalHours)) : null
  const tas = parseTACell(cell, total)
  if (tas.length === 0) return

  // Parse emails if provided (comma-separated)
  const emailList = emailsCell
    ? String(emailsCell).split(',').map((e) => e.trim()).filter(Boolean)
    : []

  for (let i = 0; i < tas.length; i++) {
    const { name, hours } = tas[i]
    const realEmail = emailList[i] ?? null

    // Synthesize email if not provided
    const email = realEmail
      ? realEmail.toLowerCase()
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@bellini-ta-placeholder.edu`

    // Upsert TA
    const { data: ta, error: taError } = await supabaseAdmin
      .from('tas')
      .upsert(
        { email, full_name: name, ta_type: taType },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (taError) {
      console.warn(`  TA upsert failed for ${name}:`, taError.message)
      continue
    }

    // Upsert assignment
    const { error: assignError } = await supabaseAdmin
      .from('ta_assignments')
      .upsert(
        { section_id: sectionId, ta_id: ta.id, hours: hours ?? null },
        { onConflict: 'section_id,ta_id' }
      )

    if (assignError) {
      console.warn(`  TA assignment failed for ${name} -> section ${sectionId}:`, assignError.message)
    }
  }
}

async function importS25() {
  console.log('=== Importing Spring 2025 (S25) ===')
  const filePath = path.resolve(process.cwd(), '..', 'Bellini Classes S25.xlsx')
  const rows = readSheet(filePath) as S25Row[]
  console.log(`Read ${rows.length} rows from ${filePath}`)

  // Ensure S25 semester exists
  await supabaseAdmin
    .from('semesters')
    .upsert(
      { code: 'S25', term_label: 'Spring 2025', term_code: '202501' },
      { onConflict: 'code' }
    )
  const { data: sem } = await supabaseAdmin
    .from('semesters')
    .select('id')
    .eq('code', 'S25')
    .single()
  const semesterId = sem!.id
  console.log(`Semester S25 id = ${semesterId}`)

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
      row.CRSE_NUMB ? String(row.CRSE_NUMB) : null,
      row.CRSE_TITLE,
      row.CRSE_LEVL
    )
    if (!courseId) { console.warn(`  Skipping CRN ${crn}: no course`); failed++; continue }

    const roomId = await upsertLookup('rooms', 'room_code', row.MEETING_ROOM)
    const instructorId = await upsertInstructor(row.INSTRUCTOR, row['INSTRUCTOR EMAIL'])

    const { start, end } = parseTimeRange(row.MEETING_TIMES)

    // Upsert section
    const { data: section, error: sectionError } = await supabaseAdmin
      .from('sections')
      .upsert(
        {
          semester_id: semesterId,
          course_id: courseId,
          crn,
          section_code: row.CRSE_SECTION ? String(row.CRSE_SECTION) : '001',
          course_level: normalizeCourseLevel(row.CRSE_LEVL),
          meeting_days: row.MEETING_DAYS ?? null,
          meeting_times: row.MEETING_TIMES ?? null,
          meeting_time_start: start,
          meeting_time_end: end,
          room_id: roomId,
          instructor_id: instructorId,
          // S25 has no enrollment columns
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
    await upsertTAs(section.id, row['Graduate TA(s)'], row['Grad Hours'], 'GRAD')
    await upsertTAs(section.id, row['UGTA(s)'], row['UG Hours'], 'UGTA')

    imported++
    if (imported % 10 === 0) console.log(`  Imported ${imported}/${rows.length} rows...`)
  }

  console.log(`\nS25 Import complete: ${imported} imported, ${failed} failed`)
}

importS25().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
