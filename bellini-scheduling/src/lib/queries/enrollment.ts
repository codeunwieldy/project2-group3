import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getEnrollmentComparison(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('enrollment_comparison')
    .select('*')
    .order('subject')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: Record<string, unknown>) => ({
    subject_code: r.subject as string,
    course_number: r.course_number as string,
    course_title: r.title as string,
    prior_code: (r.prior_code as string) ?? 'F25',
    current_code: (r.current_code as string) ?? 'S26',
    prior_enrollment: (r.prior_enrollment as number | null) ?? null,
    current_enrollment: (r.current_enrollment as number | null) ?? null,
    pct_change: (r.pct_change as number | null) ?? null,
  }))
}
