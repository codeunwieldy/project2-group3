import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getEnrollmentComparison(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('enrollment_comparison')
    .select('*')
    .order('subject')
  if (error) throw new Error(error.message)
  return data ?? []
}
