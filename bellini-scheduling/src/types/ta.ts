import type { Database, TAType } from './database'

export type TA = Database['public']['Tables']['tas']['Row']
export type TAAssignment = Database['public']['Tables']['ta_assignments']['Row']

export type TAWithAssignments = TA & {
  ta_assignments: (TAAssignment & {
    sections: {
      id: number
      crn: string
      section_code: string
      meeting_days: string | null
      meeting_times: string | null
      courses: { course_number: string; title: string; subjects: { code: string } }
      semesters: { code: string; term_label: string }
      rooms: { room_code: string } | null
    }
  })[]
}

export type TAAssignmentWithTA = TAAssignment & {
  tas: TA
}

export { TAType }
