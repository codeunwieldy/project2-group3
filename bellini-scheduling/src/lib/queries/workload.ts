import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getInstructorWorkload(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('instructor_workload')
    .select('*')
    .order('full_name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getWorkloadByInstructor(
  supabase: SupabaseClient<Database>,
  instructorId: number
) {
  const { data, error } = await supabase
    .from('instructor_workload')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('semester_id')
  if (error) throw new Error(error.message)
  return data ?? []
}
