import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type WorkloadRow = {
  instructor_id: number
  instructor_name: string | null
  semester_label: string
  section_count: number
  total_enrollment: number | null
  total_ta_hours: number
}

function mapWorkloadRow(r: Record<string, unknown>): WorkloadRow {
  return {
    instructor_id: r.instructor_id as number,
    instructor_name: (r.full_name as string | null) ?? null,
    semester_label: (r.term_label as string) ?? (r.semester as string) ?? '',
    section_count: Number(r.total_sections ?? 0),
    total_enrollment: r.total_enrolled == null ? null : Number(r.total_enrolled),
    total_ta_hours: Number(r.total_ta_hours_supervised ?? 0),
  }
}

export async function getInstructorWorkload(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('instructor_workload')
    .select('*')
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => mapWorkloadRow(r as Record<string, unknown>))
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
  return (data ?? []).map((r) => mapWorkloadRow(r as Record<string, unknown>))
}
