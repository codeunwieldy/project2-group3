import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getTAAssignmentsForSection(
  supabase: SupabaseClient<Database>,
  sectionId: number
) {
  const { data, error } = await supabase
    .from('ta_assignments')
    .select('*, tas(id, email, full_name, ta_type)')
    .eq('section_id', sectionId)
    .order('id')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getMyAssignments(
  supabase: SupabaseClient<Database>,
  email: string
) {
  const { data, error } = await supabase
    .from('ta_assignments')
    .select(`
      id, hours, assigned_at,
      tas!inner(id, email, full_name, ta_type),
      sections(
        id, crn, section_code, meeting_days, meeting_times, meeting_time_start, meeting_time_end,
        enrollment,
        courses(course_number, title, subjects(code)),
        semesters(id, code, term_label),
        rooms(room_code),
        instructors(full_name)
      )
    `)
    .eq('tas.email', email)
    .order('id', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTARatios(
  supabase: SupabaseClient<Database>,
  semesterId?: number
) {
  let query = supabase
    .from('section_ta_ratios')
    .select('*')
    .order('hours_per_student', { ascending: true, nullsFirst: true })

  if (semesterId) query = query.eq('semester_id', semesterId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Array<Record<string, unknown>>
  if (rows.length === 0) return []

  const sectionIds = rows.map((r) => r.section_id as number)
  const semesterIds = Array.from(new Set(rows.map((r) => r.semester_id as number)))

  const [{ data: semRows }, { data: secRows }, { data: assignRows }] = await Promise.all([
    supabase.from('semesters').select('id, term_label').in('id', semesterIds),
    supabase
      .from('sections')
      .select('id, instructors(full_name)')
      .in('id', sectionIds),
    supabase
      .from('ta_assignments')
      .select('section_id')
      .in('section_id', sectionIds),
  ])

  const semLabel = new Map<number, string>(
    (semRows ?? []).map((s) => [(s as { id: number }).id, (s as { term_label: string }).term_label])
  )
  const instByName = new Map<number, string | null>()
  for (const s of secRows ?? []) {
    const inst = (s as { instructors?: { full_name?: string } | { full_name?: string }[] | null }).instructors
    const name = Array.isArray(inst) ? inst[0]?.full_name : inst?.full_name
    instByName.set((s as { id: number }).id, name ?? null)
  }
  const taCount = new Map<number, number>()
  for (const a of assignRows ?? []) {
    const sid = (a as { section_id: number }).section_id
    taCount.set(sid, (taCount.get(sid) ?? 0) + 1)
  }

  return rows.map((r) => ({
    section_id: r.section_id as number,
    crn: r.crn as string,
    section_code: r.section_code as string,
    course_title: (r.course_title as string) ?? '',
    semester_label: semLabel.get(r.semester_id as number) ?? '',
    instructor_name: instByName.get(r.section_id as number) ?? null,
    enrollment: (r.enrollment as number | null) ?? null,
    total_ta_hours: Number(r.total_ta_hours ?? 0),
    ta_count: taCount.get(r.section_id as number) ?? 0,
    hours_per_student: r.hours_per_student == null ? null : Number(r.hours_per_student),
    below_threshold: Boolean(r.below_threshold),
  }))
}
