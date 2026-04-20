import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorSections } from '@/lib/queries/sections'
import InstructorCalendar from '@/components/instructor/InstructorCalendar'

export default async function MySchedulePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('instructor_id, email')
    .eq('id', user.id)
    .single()

  let instructor: { id: number; full_name: string | null; email: string | null } | null = null

  if (profile?.instructor_id) {
    const { data } = await supabase
      .from('instructors')
      .select('id, full_name, email')
      .eq('id', profile.instructor_id)
      .single()
    instructor = data ?? null
  }

  if (!instructor) {
    const lookupEmail = profile?.email ?? user.email
    if (lookupEmail) {
      const { data } = await supabase
        .from('instructors')
        .select('id, full_name, email')
        .eq('email', lookupEmail)
        .maybeSingle()
      instructor = data ?? null
    }
  }

  if (!instructor) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Schedule</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Personalized weekly teaching schedule
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="font-medium text-yellow-800">No instructor profile linked to this account</p>
          <p className="text-sm text-yellow-700 mt-1">
            Your account ({user.email}) is not linked to an instructor record. Ask an admin to set
            <code className="mx-1 px-1 py-0.5 rounded bg-yellow-100 text-yellow-900">users.instructor_id</code>
            for your user, or to add an instructor row whose email matches yours.
          </p>
        </div>
      </div>
    )
  }

  const rawSections = await getInstructorSections(supabase, instructor.id)
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
        <h2 className="text-xl font-bold text-gray-900">{instructor.full_name ?? 'My Schedule'}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Multi-semester teaching schedule
          {instructor.email && <span className="ml-2 text-gray-500">· {instructor.email}</span>}
        </p>
      </div>
      <InstructorCalendar sections={sections} instructorName={instructor.full_name ?? ''} />
    </div>
  )
}
