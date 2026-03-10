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
      tas(id, email, full_name, ta_type),
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
    .order('sections.semester_id')

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
  return data ?? []
}
