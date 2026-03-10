'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SectionWithRelations } from '@/types/section'
import { formatTimeRange } from '@/lib/utils/format'

interface Props {
  sections: SectionWithRelations[]
  semesters: { id: number; code: string; term_label: string }[]
  activeSemesterId: number | null
}

export default function SectionTable({ sections, semesters, activeSemesterId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>('crn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(activeSemesterId)

  const handleSemesterChange = (id: number) => {
    setSelectedSemesterId(id)
    router.push(`/sections?semester_id=${id}`)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sections.filter((s) => {
      if (!q) return true
      const course = s.courses
      return (
        s.crn.toLowerCase().includes(q) ||
        course.course_number.toLowerCase().includes(q) ||
        course.title.toLowerCase().includes(q) ||
        course.subjects.code.toLowerCase().includes(q) ||
        s.instructors?.full_name?.toLowerCase().includes(q) ||
        s.rooms?.room_code?.toLowerCase().includes(q) ||
        false
      )
    })
  }, [sections, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = ''
      let bVal = ''
      switch (sortKey) {
        case 'crn': aVal = a.crn; bVal = b.crn; break
        case 'subject': aVal = a.courses.subjects.code; bVal = b.courses.subjects.code; break
        case 'course': aVal = a.courses.course_number; bVal = b.courses.course_number; break
        case 'instructor': aVal = a.instructors?.full_name ?? ''; bVal = b.instructors?.full_name ?? ''; break
        case 'room': aVal = a.rooms?.room_code ?? ''; bVal = b.rooms?.room_code ?? ''; break
        default: aVal = a.crn; bVal = b.crn
      }
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-gray-500">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <select
          value={selectedSemesterId ?? ''}
          onChange={(e) => handleSemesterChange(parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.term_label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search CRN, course, instructor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-500">{sorted.length} results</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {[
                { key: 'crn', label: 'CRN' },
                { key: 'subject', label: 'Subj' },
                { key: 'course', label: 'Course #' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort(key)}
                >
                  {label} <SortIcon col={key} />
                </th>
              ))}
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Sec</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Level</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Days</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('room')}
              >
                Room <SortIcon col="room" />
              </th>
              <th
                className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('instructor')}
              >
                Instructor <SortIcon col="instructor" />
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Enrl</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500 text-sm">
                  No sections found.
                </td>
              </tr>
            ) : (
              sorted.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/sections/${s.id}`}
                      className="text-blue-700 font-medium hover:underline"
                    >
                      {s.crn}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{s.courses.subjects.code}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.courses.course_number}</td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-[200px] truncate" title={s.courses.title}>
                    {s.courses.title}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{s.section_code}</td>
                  <td className="px-4 py-2.5">
                    {s.course_level && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {s.course_level}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">
                    {s.meeting_days ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                    {formatTimeRange(s.meeting_time_start, s.meeting_time_end)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{s.rooms?.room_code ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">
                    {s.instructors?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-right">
                    {s.enrollment != null ? s.enrollment : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
