'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'

interface SectionBlock {
  id: number
  crn: string
  section_code: string
  course_number: string
  course_title: string
  subject_code: string
  meeting_days: string | null
  meeting_times: string | null
  meeting_time_start: string | null
  meeting_time_end: string | null
  room_code: string | null
  semester_label: string
  semester_code: string
  enrollment: number | null
  ta_count: number
}

interface Props {
  sections: SectionBlock[]
  instructorName: string
}

const DAYS = ['M', 'T', 'W', 'R', 'F']
const DAY_LABELS: Record<string, string> = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }

// Map semester codes to colors
const SEMESTER_COLORS: Record<number, string> = {}
const COLOR_POOL = [
  'bg-blue-200 border-blue-400 text-blue-800',
  'bg-emerald-200 border-emerald-400 text-emerald-800',
  'bg-violet-200 border-violet-400 text-violet-800',
  'bg-amber-200 border-amber-400 text-amber-800',
]

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToPct(minutes: number): number {
  // 8am = 480, 10pm = 1320 — 840 minute range
  return ((minutes - 480) / 840) * 100
}

export default function InstructorCalendar({ sections, instructorName }: Props) {
  const [selectedSection, setSelectedSection] = useState<SectionBlock | null>(null)

  if (sections.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <p className="font-medium text-blue-900">No sections assigned</p>
        <p className="text-sm text-blue-700 mt-1">
          {instructorName
            ? `${instructorName} is not currently assigned to any sections in the imported semesters (S25 / F25 / S26).`
            : 'No sections are assigned to this instructor in any imported semester (S25 / F25 / S26).'}
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Once a section is assigned to this instructor in the database, it will appear here automatically.
        </p>
      </div>
    )
  }

  // Assign colors to semesters
  const semesterCodes = [...new Set(sections.map(s => s.semester_code))]
  semesterCodes.forEach((code, i) => {
    const hash = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    SEMESTER_COLORS[hash] = COLOR_POOL[i % COLOR_POOL.length]
  })

  function getSemesterColor(semesterCode: string) {
    const hash = semesterCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return SEMESTER_COLORS[hash] ?? COLOR_POOL[0]
  }

  function getSectionsForDay(day: string): SectionBlock[] {
    return sections.filter(s => s.meeting_days?.includes(day) && s.meeting_time_start && s.meeting_time_end)
  }

  const uniqueSemesters = [...new Set(sections.map(s => s.semester_label))]

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {semesterCodes.map(code => {
          const label = sections.find(s => s.semester_code === code)?.semester_label ?? code
          return (
            <div key={code} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getSemesterColor(code)}`}>
              {label}
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 max-w-md">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Sections</p>
          <p className="text-xl font-bold">{sections.length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Semesters</p>
          <p className="text-xl font-bold">{uniqueSemesters.length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Total Enrolled</p>
          <p className="text-xl font-bold">{sections.reduce((s, r) => s + (r.enrollment ?? 0), 0)}</p>
        </div>
      </div>

      {/* Week Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {DAYS.map(day => {
            const daySections = getSectionsForDay(day)
            return (
              <div key={day} className="min-h-96">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 text-center">
                  {DAY_LABELS[day]}
                </div>
                <div className="relative px-1 py-1 space-y-1">
                  {daySections.map(section => (
                    <button
                      key={`${section.id}-${day}`}
                      onClick={() => setSelectedSection(section)}
                      className={`w-full text-left px-2 py-1.5 rounded border text-xs cursor-pointer hover:opacity-80 transition-opacity ${getSemesterColor(section.semester_code)}`}
                    >
                      <div className="font-bold truncate">{section.subject_code} {section.course_number}</div>
                      <div className="text-xs opacity-75 truncate">{section.meeting_times}</div>
                      {section.room_code && (
                        <div className="text-xs opacity-60">{section.room_code}</div>
                      )}
                    </button>
                  ))}
                  {daySections.length === 0 && (
                    <div className="text-center text-gray-200 text-xs py-4">—</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Online / TBA sections */}
      {sections.filter(s => !s.meeting_days || s.meeting_days === 'ONLINE' || !s.meeting_time_start).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-medium text-gray-700 text-sm mb-3">Online / No Scheduled Meeting Time</h4>
          <div className="space-y-1">
            {sections
              .filter(s => !s.meeting_days || s.meeting_days === 'ONLINE' || !s.meeting_time_start)
              .map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="info">{s.semester_label}</Badge>
                  <span className="font-medium">{s.section_code}</span>
                  <span className="text-gray-500">{s.course_title}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Section detail modal */}
      {selectedSection && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedSection(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${getSemesterColor(selectedSection.semester_code)}`}>
              {selectedSection.semester_label}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{selectedSection.subject_code} {selectedSection.course_number}</h3>
            <p className="text-gray-600 mb-3">{selectedSection.course_title}</p>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Section</dt><dd>{selectedSection.section_code}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">CRN</dt><dd className="font-mono">{selectedSection.crn}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Days</dt><dd>{selectedSection.meeting_days ?? '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Time</dt><dd>{selectedSection.meeting_times ?? '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Room</dt><dd>{selectedSection.room_code ?? '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Enrollment</dt><dd>{selectedSection.enrollment ?? '—'}</dd></div>
            </dl>
            <button
              onClick={() => setSelectedSection(null)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
