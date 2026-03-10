'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TAAssignmentWithTA } from '@/types/ta'

interface UseRealtimeTAOptions {
  taEmail: string
  onUpdate: (assignments: TAAssignmentWithTA[]) => void
}

export function useRealtimeTA({ taEmail, onUpdate }: UseRealtimeTAOptions) {
  const fetchAssignments = useCallback(async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('ta_assignments')
      .select(`
        *,
        tas(id, email, full_name, ta_type),
        sections(
          id, crn, section_code, meeting_days, meeting_times, enrollment,
          courses(course_number, title, subjects(code)),
          semesters(code, term_label),
          rooms(room_code),
          instructors(full_name)
        )
      `)
      .eq('tas.email', taEmail)

    if (data) onUpdate(data as unknown as TAAssignmentWithTA[])
  }, [taEmail, onUpdate])

  useEffect(() => {
    fetchAssignments()

    const supabase = createClient()

    const channel = supabase
      .channel('ta-assignments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ta_assignments' },
        () => {
          fetchAssignments()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [fetchAssignments])
}
