'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

interface TARatio {
  section_id: number
  crn: string
  section_code: string
  course_title: string
  semester_label: string
  instructor_name: string | null
  enrollment: number | null
  total_ta_hours: number
  ta_count: number
  hours_per_student: number | null
  below_threshold: boolean
}

interface Props {
  data: TARatio[]
}

export default function TARatioTable({ data }: Props) {
  const flagged = data.filter(r => r.below_threshold)
  const ok = data.filter(r => !r.below_threshold)

  return (
    <div className="space-y-6">
      {flagged.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-red-700">Flagged Sections</h3>
            <Badge variant="danger">{flagged.length}</Badge>
            <span className="text-xs text-gray-400">(below 0.1 hrs/student threshold)</span>
          </div>
          <RatioTable rows={flagged} />
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-gray-700">All Sections</h3>
          <Badge variant="default">{data.length}</Badge>
        </div>
        <RatioTable rows={data} />
      </div>
    </div>
  )
}

function RatioTable({ rows }: { rows: TARatio[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Section</th>
              <th className="px-4 py-3 text-left">Course</th>
              <th className="px-4 py-3 text-left">Semester</th>
              <th className="px-4 py-3 text-left">Instructor</th>
              <th className="px-4 py-3 text-right">Enrollment</th>
              <th className="px-4 py-3 text-right">TA Hours</th>
              <th className="px-4 py-3 text-right">Hrs/Student</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr
                key={row.section_id}
                className={`hover:bg-gray-50 ${row.below_threshold ? 'bg-red-50' : ''}`}
              >
                <td className="px-4 py-3 font-mono font-medium">{row.section_code}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{row.course_title}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{row.semester_label}</td>
                <td className="px-4 py-3 text-gray-600">{row.instructor_name ?? '—'}</td>
                <td className="px-4 py-3 text-right">{row.enrollment ?? '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{row.total_ta_hours}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {row.hours_per_student != null
                    ? row.hours_per_student.toFixed(2)
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {row.below_threshold ? (
                    <Badge variant="danger">Below threshold</Badge>
                  ) : (
                    <Badge variant="success">OK</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/ta-management/${row.section_id}`}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Assign TAs
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
