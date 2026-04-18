import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getDuplicateCRNs(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase.rpc('get_duplicate_crns', {
    p_semester_id: semesterId,
  })
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Record<string, unknown>>
  if (rows.length === 0) return []

  // Resolve section ids -> section_code + course_title for display.
  const allIds = Array.from(
    new Set(rows.flatMap((r) => (r.section_ids as number[] | null) ?? []))
  )
  const { data: sectionRows } = await supabase
    .from('sections')
    .select('id, section_code, courses(title)')
    .in('id', allIds)

  const byId = new Map<number, { id: number; section_code: string; course_title: string }>()
  for (const s of sectionRows ?? []) {
    const courses = (s as { courses?: { title?: string } | { title?: string }[] }).courses
    const title = Array.isArray(courses) ? courses[0]?.title : courses?.title
    byId.set((s as { id: number }).id, {
      id: (s as { id: number }).id,
      section_code: (s as { section_code: string }).section_code,
      course_title: title ?? '',
    })
  }

  return rows.map((r) => ({
    crn: r.crn as string,
    count: Number(r.section_count ?? 0),
    sections: ((r.section_ids as number[] | null) ?? [])
      .map((id) => byId.get(id))
      .filter((x): x is { id: number; section_code: string; course_title: string } => !!x),
  }))
}

export async function getRoomOverlaps(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase.rpc('get_room_overlaps', {
    p_semester_id: semesterId,
  })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Array<Record<string, unknown>>
  return rows.map((r) => {
    const [tStart, tEnd] = String(r.time_a ?? '').split('-')
    return {
      section_a_id: r.section_a_id as number,
      section_b_id: r.section_b_id as number,
      section_a_code: (r.section_a_crn as string) ?? '',
      section_b_code: (r.section_b_crn as string) ?? '',
      course_a: (r.section_a_course as string) ?? '',
      course_b: (r.section_b_course as string) ?? '',
      room: (r.room_code as string) ?? '',
      days: (r.overlap_days as string) ?? '',
      time_start: tStart ?? '',
      time_end: tEnd ?? '',
    }
  })
}

export async function getInstructorOverlaps(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase.rpc('get_instructor_overlaps', {
    p_semester_id: semesterId,
  })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Array<Record<string, unknown>>
  return rows.map((r) => {
    const [tStart, tEnd] = String(r.time_a ?? '').split('-')
    return {
      section_a_id: r.section_a_id as number,
      section_b_id: r.section_b_id as number,
      section_a_code: (r.section_a_crn as string) ?? '',
      section_b_code: (r.section_b_crn as string) ?? '',
      course_a: (r.section_a_course as string) ?? '',
      course_b: (r.section_b_course as string) ?? '',
      instructor: (r.instructor_name as string) ?? '',
      days: (r.overlap_days as string) ?? '',
      time_start: tStart ?? '',
      time_end: tEnd ?? '',
    }
  })
}

export async function getUnreasonableTimes(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase
    .from('sections')
    .select(`
      id, crn, section_code, meeting_days, meeting_time_start, meeting_time_end,
      courses(course_number, title, subjects(code))
    `)
    .eq('semester_id', semesterId)
    .not('meeting_time_start', 'is', null)
    .or('meeting_time_start.lt.07:00:00,meeting_time_end.gt.22:00:00')

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Record<string, unknown>>
  return rows.map((r) => {
    const courses = r.courses as
      | { course_number?: string; title?: string; subjects?: { code?: string } | { code?: string }[] }
      | { course_number?: string; title?: string; subjects?: { code?: string } | { code?: string }[] }[]
      | null
    const c = Array.isArray(courses) ? courses[0] : courses
    const subj = Array.isArray(c?.subjects) ? c?.subjects[0] : c?.subjects
    const courseLabel = c
      ? `${subj?.code ?? ''} ${c.course_number ?? ''} — ${c.title ?? ''}`.trim()
      : ''
    const tStart = r.meeting_time_start as string | null
    const tEnd = r.meeting_time_end as string | null
    const issues: string[] = []
    if (tStart && tStart < '07:00:00') issues.push('Starts before 7 AM')
    if (tEnd && tEnd > '22:00:00') issues.push('Ends after 10 PM')
    return {
      id: r.id as number,
      crn: r.crn as string,
      section_code: r.section_code as string,
      course_title: courseLabel,
      issue: issues.join('; ') || 'Off-hours meeting time',
      meeting_times: `${r.meeting_days ?? ''} ${tStart ?? ''}–${tEnd ?? ''}`.trim(),
    }
  })
}

export async function getAuditLog(
  supabase: SupabaseClient<Database>,
  options: { tableName?: string; limit?: number } = {}
) {
  let query = supabase
    .from('audit_log')
    .select('*, users(email, display_name)')
    .order('changed_at', { ascending: false })
    .limit(options.limit ?? 100)

  if (options.tableName) query = query.eq('table_name', options.tableName)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
