import { createClient } from '@/lib/supabase/server'
import { getSectionById } from '@/lib/queries/sections'
import { formatTimeRange, formatEnrollment, formatDate } from '@/lib/utils/format'
import { DAY_LABELS } from '@/lib/utils/days'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import type { DayCode } from '@/lib/utils/days'

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const section = await getSectionById(supabase, parseInt(id))

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-700">Section not found</p>
        <p className="mt-1 text-sm text-gray-500">The section you are looking for does not exist or has been removed.</p>
        <Link
          href="/sections"
          className="mt-6 text-sm text-blue-700 hover:underline"
        >
          &larr; Back to Sections
        </Link>
      </div>
    )
  }

  const course = section.courses
  const subject = course.subjects
  const room = section.rooms
  const instructor = section.instructors
  const semester = section.semesters
  const campus = section.campuses

  const courseTitle = `${subject.code} ${course.course_number} — ${course.title}`

  // Expand days string into labels, e.g. "MWF" -> "Monday, Wednesday, Friday"
  const dayLabels = section.meeting_days
    ? section.meeting_days
        .split('')
        .filter((d): d is DayCode => d in DAY_LABELS)
        .map((d) => DAY_LABELS[d as DayCode])
        .join(', ')
    : 'TBA'

  const timeDisplay = formatTimeRange(section.meeting_time_start, section.meeting_time_end)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{courseTitle}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            CRN {section.crn} &bull; Section {section.section_code}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Link
            href={`/sections/${id}/edit`}
            className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Main details card */}
      <Card title="Section Details">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Semester</dt>
            <dd className="mt-1 text-sm text-gray-900">{semester.term_label}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Campus</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {campus ? campus.name ?? campus.code : '—'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Level</dt>
            <dd className="mt-1">
              {section.course_level ? (
                <Badge variant={section.course_level === 'GR' ? 'info' : 'default'}>
                  {section.course_level === 'GR' ? 'Graduate' : 'Undergraduate'}
                </Badge>
              ) : (
                <span className="text-sm text-gray-900">—</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Days</dt>
            <dd className="mt-1 text-sm text-gray-900">{dayLabels}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</dt>
            <dd className="mt-1 text-sm text-gray-900">{timeDisplay}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Room</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {room ? `${room.room_code}${room.building ? ` (${room.building})` : ''}` : 'TBA'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Instructor</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {instructor ? (
                <>
                  {instructor.full_name && (
                    <span className="block">{instructor.full_name}</span>
                  )}
                  <span className="text-gray-600">{instructor.email}</span>
                </>
              ) : (
                '—'
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Enrollment</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatEnrollment(section.enrollment)}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waitlist</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {section.wait_list_actual != null || section.wait_list_max != null
                ? `${formatEnrollment(section.wait_list_actual)} / ${formatEnrollment(section.wait_list_max)}`
                : '—'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(section.start_date)}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(section.end_date)}</dd>
          </div>
        </dl>
      </Card>

      {/* TA Assignments */}
      <Card title="TA Assignments">
        {section.ta_assignments && section.ta_assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-6 font-medium text-gray-500">Name</th>
                  <th className="text-left py-2 pr-6 font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 font-medium text-gray-500">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {section.ta_assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="py-2.5 pr-6 text-gray-900">
                      {assignment.tas.full_name ?? assignment.tas.email}
                    </td>
                    <td className="py-2.5 pr-6">
                      <Badge variant="info">{assignment.tas.ta_type}</Badge>
                    </td>
                    <td className="py-2.5 text-gray-900">
                      {assignment.hours != null ? `${assignment.hours}h` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No TAs assigned to this section.</p>
        )}
      </Card>

      {/* Back link */}
      <div>
        <Link href="/sections" className="text-sm text-blue-700 hover:underline">
          &larr; Back to Sections
        </Link>
      </div>
    </div>
  )
}
