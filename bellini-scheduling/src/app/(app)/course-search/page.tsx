'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import CourseTimeline from '@/components/course-search/CourseTimeline'

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

export default function CourseSearchPage() {
  const [subject, setSubject] = useState('')
  const [courseNumber, setCourseNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CourseSection[] | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !courseNumber.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(
        `/api/sections?subject=${encodeURIComponent(subject.trim().toUpperCase())}&course_number=${encodeURIComponent(courseNumber.trim())}`
      )
      const data = await res.json()
      setResults(Array.isArray(data) ? data as CourseSection[] : [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Course Search</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Search for any course across all semesters
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. COP"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 uppercase"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Course Number</label>
          <input
            type="text"
            value={courseNumber}
            onChange={(e) => setCourseNumber(e.target.value)}
            placeholder="e.g. 4703"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Spinner size="sm" /> Searching...
        </div>
      )}

      {!loading && searched && results !== null && (
        results.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No sections found for {subject.toUpperCase()} {courseNumber}.
          </div>
        ) : (
          <CourseTimeline sections={results} />
        )
      )}
    </div>
  )
}
