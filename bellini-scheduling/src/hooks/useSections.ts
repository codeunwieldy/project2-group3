'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SectionWithRelations } from '@/types/section'

interface UseSectionsOptions {
  semesterId?: number
  subjectCode?: string
  instructorId?: number
}

export function useSections(options: UseSectionsOptions = {}) {
  const [sections, setSections] = useState<SectionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchSections() {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('sections')
        .select(`
          *,
          courses(id, course_number, title, course_level, subjects(id, code, name)),
          rooms(id, room_code, building),
          instructors(id, email, full_name),
          semesters(id, code, term_label),
          campuses(id, code, name)
        `)
        .order('crn')

      if (options.semesterId) {
        query = query.eq('semester_id', options.semesterId)
      }
      if (options.instructorId) {
        query = query.eq('instructor_id', options.instructorId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setSections((data as unknown as SectionWithRelations[]) ?? [])
      }
      setLoading(false)
    }

    fetchSections()
  }, [options.semesterId, options.subjectCode, options.instructorId])

  return { sections, loading, error }
}
