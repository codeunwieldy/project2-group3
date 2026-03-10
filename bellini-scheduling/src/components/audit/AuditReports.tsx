'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

interface DuplicateCRN {
  crn: string
  count: number
  sections: { id: number; section_code: string; course_title: string }[]
}

interface Overlap {
  section_a_id: number
  section_b_id: number
  section_a_code: string
  section_b_code: string
  course_a: string
  course_b: string
  room?: string
  instructor?: string
  days: string
  time_start: string
  time_end: string
}

interface UnreasonableTime {
  id: number
  crn: string
  section_code: string
  course_title: string
  issue: string
  meeting_times: string
}

interface Semester {
  id: number
  code: string
  term_label: string
}

interface Props {
  semesters: Semester[]
}

type TabType = 'duplicate_crns' | 'room_overlaps' | 'instructor_overlaps' | 'unreasonable_times'

const TABS: { key: TabType; label: string }[] = [
  { key: 'duplicate_crns', label: 'Duplicate CRNs' },
  { key: 'room_overlaps', label: 'Room Overlaps' },
  { key: 'instructor_overlaps', label: 'Instructor Overlaps' },
  { key: 'unreasonable_times', label: 'Anomalous Times' },
]

export default function AuditReports({ semesters }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('duplicate_crns')
  const [semesterId, setSemesterId] = useState<number>(semesters[0]?.id ?? 0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<unknown[] | null>(null)

  async function fetchData(tab: TabType, sid: number) {
    if (!sid) return
    setLoading(true)
    setData(null)
    try {
      const res = await fetch(`/api/audit?type=${tab}&semester_id=${sid}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch {
      setData([])
    }
    setLoading(false)
  }

  function handleTabChange(tab: TabType) {
    setActiveTab(tab)
    fetchData(tab, semesterId)
  }

  function handleSemesterChange(id: number) {
    setSemesterId(id)
    fetchData(activeTab, id)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Semester:</label>
        <select
          value={semesterId}
          onChange={(e) => handleSemesterChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>{s.term_label}</option>
          ))}
        </select>
        <button
          onClick={() => fetchData(activeTab, semesterId)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          Run Audit
        </button>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
                activeTab === tab.key
                  ? 'bg-white border-gray-200 text-blue-700 border-b-white -mb-px'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Spinner size="sm" /> Running audit...
        </div>
      )}

      {!loading && data === null && (
        <div className="text-center text-gray-400 py-12">
          Select a semester and click "Run Audit" to view results.
        </div>
      )}

      {!loading && data !== null && data.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-3">
          <span className="text-green-600 text-xl">✓</span>
          <div>
            <p className="font-medium text-green-800">No issues found</p>
            <p className="text-sm text-green-600">No {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} detected for this semester.</p>
          </div>
        </div>
      )}

      {!loading && data !== null && data.length > 0 && (
        <div className="space-y-3">
          {activeTab === 'duplicate_crns' && (
            <DuplicateCRNTable rows={data as DuplicateCRN[]} />
          )}
          {activeTab === 'room_overlaps' && (
            <OverlapTable rows={data as Overlap[]} type="room" />
          )}
          {activeTab === 'instructor_overlaps' && (
            <OverlapTable rows={data as Overlap[]} type="instructor" />
          )}
          {activeTab === 'unreasonable_times' && (
            <UnreasonableTimesTable rows={data as UnreasonableTime[]} />
          )}
        </div>
      )}
    </div>
  )
}

function DuplicateCRNTable({ rows }: { rows: DuplicateCRN[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-red-50 border-b border-red-100">
        <p className="text-sm font-medium text-red-800">{rows.length} duplicate CRN{rows.length !== 1 ? 's' : ''} found</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">CRN</th>
            <th className="px-4 py-3 text-left">Count</th>
            <th className="px-4 py-3 text-left">Sections</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-medium text-red-700">{row.crn}</td>
              <td className="px-4 py-3">
                <Badge variant="danger">{row.count}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{String(row.sections || '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OverlapTable({ rows, type }: { rows: Overlap[]; type: 'room' | 'instructor' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
        <p className="text-sm font-medium text-yellow-800">{rows.length} {type} overlap{rows.length !== 1 ? 's' : ''} found</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Section A</th>
            <th className="px-4 py-3 text-left">Section B</th>
            <th className="px-4 py-3 text-left">{type === 'room' ? 'Room' : 'Instructor'}</th>
            <th className="px-4 py-3 text-left">Days</th>
            <th className="px-4 py-3 text-left">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className="font-medium">{row.section_a_code}</span>
                <span className="text-gray-400 ml-1 text-xs">{row.course_a}</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium">{row.section_b_code}</span>
                <span className="text-gray-400 ml-1 text-xs">{row.course_b}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{type === 'room' ? row.room : row.instructor}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.days}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.time_start}–{row.time_end}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UnreasonableTimesTable({ rows }: { rows: UnreasonableTime[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
        <p className="text-sm font-medium text-orange-800">{rows.length} anomalous time{rows.length !== 1 ? 's' : ''} found</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 text-left">CRN</th>
            <th className="px-4 py-3 text-left">Section</th>
            <th className="px-4 py-3 text-left">Course</th>
            <th className="px-4 py-3 text-left">Meeting Times</th>
            <th className="px-4 py-3 text-left">Issue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-orange-700">{row.crn}</td>
              <td className="px-4 py-3 font-medium">{row.section_code}</td>
              <td className="px-4 py-3 text-gray-600">{row.course_title}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.meeting_times}</td>
              <td className="px-4 py-3">
                <Badge variant="warning">{row.issue}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
