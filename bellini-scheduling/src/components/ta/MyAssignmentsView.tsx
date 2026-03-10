'use client'

import { useState } from 'react'
import { useRealtimeTA } from '@/hooks/useRealtimeTA'
import { Badge } from '@/components/ui/Badge'
import type { TAAssignmentWithTA } from '@/types/ta'

interface TAAssignment {
  id: number
  hours: number
  assigned_at: string
  section: {
    id: number
    crn: string
    section_code: string
    course_title: string
    semester_label: string
    meeting_days: string | null
    meeting_times: string | null
    instructor_name: string | null
  }
}

interface Props {
  initialAssignments: TAAssignment[]
  userEmail: string
}

export default function MyAssignmentsView({ initialAssignments, userEmail }: Props) {
  const [assignments, setAssignments] = useState(initialAssignments)

  // useRealtimeTA re-fetches from Supabase on any ta_assignment change and calls onUpdate
  useRealtimeTA({
    taEmail: userEmail,
    onUpdate: (_fresh: TAAssignmentWithTA[]) => {
      // Re-fetch from our API route which returns the mapped shape we need
      fetch(`/api/ta-assignments?email=${encodeURIComponent(userEmail)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setAssignments(data)
        })
        .catch(() => {})
    },
  })

  const totalHours = assignments.reduce((sum, a) => sum + (a.hours ?? 0), 0)

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-gray-500">No TA assignments found for your account.</p>
        <p className="text-xs text-gray-300 mt-1">{userEmail}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-500 font-medium uppercase">Sections</p>
          <p className="text-2xl font-bold text-blue-700">{assignments.length}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs text-purple-500 font-medium uppercase">Total Hours</p>
          <p className="text-2xl font-bold text-purple-700">{totalHours}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Section</th>
              <th className="px-4 py-3 text-left">Course</th>
              <th className="px-4 py-3 text-left">Semester</th>
              <th className="px-4 py-3 text-left">Schedule</th>
              <th className="px-4 py-3 text-left">Instructor</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-left">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium">{a.section.section_code}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{a.section.course_title}</td>
                <td className="px-4 py-3">
                  <Badge variant="info">{a.section.semester_label}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                  {a.section.meeting_days && a.section.meeting_times
                    ? `${a.section.meeting_days} ${a.section.meeting_times}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{a.section.instructor_name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-semibold">{a.hours}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(a.assigned_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
