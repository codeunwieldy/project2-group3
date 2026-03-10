import type { Database, CourseLevel } from './database'

export type Section = Database['public']['Tables']['sections']['Row']
export type SectionInsert = Database['public']['Tables']['sections']['Insert']
export type SectionUpdate = Database['public']['Tables']['sections']['Update']

export type SectionWithRelations = Section & {
  courses: {
    id: number
    course_number: string
    title: string
    course_level: CourseLevel | null
    subjects: { id: number; code: string; name: string | null }
  }
  rooms: { id: number; room_code: string; building: string | null } | null
  instructors: { id: number; email: string; full_name: string | null } | null
  semesters: { id: number; code: string; term_label: string }
  campuses: { id: number; code: string; name: string | null } | null
}

export type SectionWithTAs = SectionWithRelations & {
  ta_assignments: {
    id: number
    hours: number | null
    tas: { id: number; email: string; full_name: string | null; ta_type: string }
  }[]
}
