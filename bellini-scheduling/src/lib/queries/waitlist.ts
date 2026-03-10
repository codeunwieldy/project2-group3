import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getWaitlistAlerts(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('waitlist_alerts')
    .select('*')
    .order('subject')
  if (error) throw new Error(error.message)
  return data ?? []
}
