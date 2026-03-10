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
  return data ?? []
}

export async function getRoomOverlaps(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase.rpc('get_room_overlaps', {
    p_semester_id: semesterId,
  })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getInstructorOverlaps(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase.rpc('get_instructor_overlaps', {
    p_semester_id: semesterId,
  })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUnreasonableTimes(
  supabase: SupabaseClient<Database>,
  semesterId: number
) {
  const { data, error } = await supabase
    .from('sections')
    .select(`
      id, crn, section_code, meeting_days, meeting_time_start, meeting_time_end,
      courses(course_number, title, subjects(code)),
      rooms(room_code),
      instructors(full_name)
    `)
    .eq('semester_id', semesterId)
    .not('meeting_time_start', 'is', null)
    .or('meeting_time_start.lt.07:00:00,meeting_time_end.gt.22:00:00')

  if (error) throw new Error(error.message)
  return data ?? []
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
