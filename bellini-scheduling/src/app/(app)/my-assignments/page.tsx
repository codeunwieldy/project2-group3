import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyAssignments } from '@/lib/queries/ta-assignments'
import MyAssignmentsView from '@/components/ta/MyAssignmentsView'

export default async function MyAssignmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawAssignments = await getMyAssignments(supabase, user.email ?? '')

  // Map nested relations to the flat shape expected by MyAssignmentsView
  const assignments = rawAssignments.map((a: Record<string, unknown>) => {
    const sec = a.sections as Record<string, unknown> | null
    const course = sec?.courses as Record<string, unknown> | null
    const subject = course?.subjects as Record<string, unknown> | null
    const semester = sec?.semesters as Record<string, unknown> | null
    const instructor = sec?.instructors as Record<string, unknown> | null
    return {
      id: a.id as number,
      hours: a.hours as number,
      assigned_at: a.assigned_at as string,
      section: {
        id: (sec?.id ?? 0) as number,
        crn: (sec?.crn ?? '') as string,
        section_code: (sec?.section_code ?? '') as string,
        course_title: `${subject?.code ?? ''} ${course?.course_number ?? ''} - ${course?.title ?? ''}`,
        semester_label: (semester?.term_label ?? '') as string,
        meeting_days: (sec?.meeting_days ?? null) as string | null,
        meeting_times: (sec?.meeting_times ?? null) as string | null,
        instructor_name: (instructor?.full_name ?? null) as string | null,
      },
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">My TA Assignments</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Your assigned sections and allocated hours
        </p>
      </div>
      <MyAssignmentsView initialAssignments={assignments} userEmail={user.email ?? ''} />
    </div>
  )
}
