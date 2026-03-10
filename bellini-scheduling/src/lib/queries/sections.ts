import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SectionWithRelations, SectionWithTAs } from '@/types/section'

const SECTION_RELATIONS = `
  *,
  courses(id, course_number, title, course_level, subjects(id, code, name)),
  rooms(id, room_code, building),
  instructors(id, email, full_name),
  semesters(id, code, term_label),
  campuses(id, code, name)
` as const

export async function getSections(
  supabase: SupabaseClient<Database>,
  options: {
    semesterId?: number
    courseId?: number
    instructorId?: number
    roomId?: number
    crn?: string
    limit?: number
    offset?: number
  } = {}
): Promise<SectionWithRelations[]> {
  let query = supabase
    .from('sections')
    .select(SECTION_RELATIONS)
    .order('crn')

  if (options.semesterId) query = query.eq('semester_id', options.semesterId)
  if (options.courseId) query = query.eq('course_id', options.courseId)
  if (options.instructorId) query = query.eq('instructor_id', options.instructorId)
  if (options.roomId) query = query.eq('room_id', options.roomId)
  if (options.crn) query = query.eq('crn', options.crn)
  if (options.limit) query = query.limit(options.limit)
  if (options.offset) query = query.range(options.offset, (options.offset + (options.limit ?? 50)) - 1)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as unknown as SectionWithRelations[]) ?? []
}

export async function getSectionById(
  supabase: SupabaseClient<Database>,
  id: number
): Promise<SectionWithTAs | null> {
  const { data, error } = await supabase
    .from('sections')
    .select(`
      ${SECTION_RELATIONS},
      ta_assignments(id, hours, tas(id, email, full_name, ta_type))
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as SectionWithTAs
}

export async function getInstructorSections(
  supabase: SupabaseClient<Database>,
  instructorId: number
): Promise<SectionWithTAs[]> {
  const { data, error } = await supabase
    .from('sections')
    .select(`
      ${SECTION_RELATIONS},
      ta_assignments(id, hours, tas(id, email, full_name, ta_type))
    `)
    .eq('instructor_id', instructorId)
    .order('meeting_time_start')

  if (error) throw new Error(error.message)
  return (data as unknown as SectionWithTAs[]) ?? []
}

export async function searchCourse(
  supabase: SupabaseClient<Database>,
  subject: string,
  courseNumber: string
): Promise<SectionWithTAs[]> {
  // First find the course
  const { data: course } = await supabase
    .from('courses')
    .select('id, subjects!inner(code)')
    .eq('course_number', courseNumber)
    .eq('subjects.code', subject.toUpperCase())
    .single()

  if (!course) return []

  const { data, error } = await supabase
    .from('sections')
    .select(`
      ${SECTION_RELATIONS},
      ta_assignments(id, hours, tas(id, email, full_name, ta_type))
    `)
    .eq('course_id', course.id)
    .order('semester_id')

  if (error) throw new Error(error.message)
  return (data as unknown as SectionWithTAs[]) ?? []
}
