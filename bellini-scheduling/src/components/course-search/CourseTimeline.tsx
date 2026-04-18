'use client'

import { Badge } from '@/components/ui/Badge'

interface CourseSection {
  id: number
  crn: string
  section_code: string
  semester_label: string
  semester_code: string
  meeting_days: string | null
  meeting_times: string | null
  room_code: string | null
  instructor_name: string | null
  enrollment: number | null
  course_title: string
  subject_code: string
  course_number: string
}

interface Props {
  sections: CourseSection[]
}

const SEMESTER_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-500' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-500' },
]

export default function CourseTimeline({ sections }: Props) {
  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
        No sections found.
      </div>
    )
  }

  const semesters = [...new Set(sections.map(s => s.semester_code))]
    .sort()
    .map((code, i) => ({
      code,
      label: sections.find(s => s.semester_code === code)?.semester_label ?? code,
      color: SEMESTER_COLORS[i % SEMESTER_COLORS.length],
    }))

  const courseTitle = sections[0]?.course_title ?? ''
  const subjectCode = sections[0]?.subject_code ?? ''
  const courseNumber = sections[0]?.course_number ?? ''

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900">{subjectCode} {courseNumber}</h3>
        <p className="text-gray-500">{courseTitle}</p>
        <div className="flex gap-2 mt-3">
          {semesters.map(s => (
            <div key={s.code} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${s.color.bg} ${s.color.border} ${s.color.text}`}>
              <span className={`w-2 h-2 rounded-full ${s.color.dot}`}></span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline lanes per semester */}
      <div className="space-y-3">
        {semesters.map(semester => {
          const semSections = sections.filter(s => s.semester_code === semester.code)
          return (
            <div key={semester.code} className={`bg-white rounded-xl border ${semester.color.border} overflow-hidden`}>
              <div className={`px-4 py-2 ${semester.color.bg} border-b ${semester.color.border}`}>
                <h4 className={`font-semibold text-sm ${semester.color.text}`}>{semester.label} — {semSections.length} section{semSections.length !== 1 ? 's' : ''}</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {semSections.map(section => (
                  <div key={section.id} className="px-4 py-3 flex items-start gap-4 hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-medium text-sm text-gray-900">{section.section_code}</span>
                        <span className="text-xs text-gray-500">CRN {section.crn}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                        <div>
                          <span className="text-gray-500">Days/Time:</span>{' '}
                          <span className="font-medium text-gray-700">
                            {section.meeting_days && section.meeting_times
                              ? `${section.meeting_days} ${section.meeting_times}`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Room:</span>{' '}
                          <span className="font-medium text-gray-700">{section.room_code ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Instructor:</span>{' '}
                          <span className="font-medium text-gray-700">{section.instructor_name ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                    {section.enrollment !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Enrolled</p>
                        <p className="font-bold text-gray-800">{section.enrollment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Sections</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{semesters.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Semesters Offered</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {sections.reduce((s, r) => s + (r.enrollment ?? 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total Enrolled</p>
        </div>
      </div>
    </div>
  )
}
