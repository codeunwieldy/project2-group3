import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorSections } from '@/lib/queries/sections'
import InstructorCalendar from '@/components/instructor/InstructorCalendar'

export default async function InstructorSchedulePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const instructorId = parseInt(params.id)

  const { data: instructor } = await supabase
    .from('instructors')
    .select('id, full_name, email')
    .eq('id', instructorId)
    .single()

  if (!instructor) redirect('/sections')

  const rawSections = await getInstructorSections(supabase, instructorId)

  // Map nested relations to flat shape expected by InstructorCalendar
  const sections = rawSections.map((s: Record<string, unknown>) => {
    const course = s.courses as Record<string, unknown> | null
    const room = s.rooms as Record<string, unknown> | null
    const semester = s.semesters as Record<string, unknown> | null
    const subject = course?.subjects as Record<string, unknown> | null
    const tas = s.ta_assignments as unknown[] | null

    return {
      id: s.id as number,
      crn: s.crn as string,
      section_code: s.section_code as string,
      course_number: (course?.course_number ?? '') as string,
      course_title: (course?.title ?? '') as string,
      subject_code: (subject?.code ?? '') as string,
      meeting_days: s.meeting_days as string | null,
      meeting_times: s.meeting_times as string | null,
      meeting_time_start: s.meeting_time_start as string | null,
      meeting_time_end: s.meeting_time_end as string | null,
      room_code: (room?.room_code ?? null) as string | null,
      semester_label: (semester?.term_label ?? '') as string,
      semester_code: (semester?.code ?? '') as string,
      enrollment: s.enrollment as number | null,
      ta_count: Array.isArray(tas) ? tas.length : 0,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{instructor.full_name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Multi-semester teaching schedule
          {instructor.email && <span className="ml-2 text-gray-400">· {instructor.email}</span>}
        </p>
      </div>
      <InstructorCalendar sections={sections} instructorName={instructor.full_name ?? ''} />
    </div>
  )
}
