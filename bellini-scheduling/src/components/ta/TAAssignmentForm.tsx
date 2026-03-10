'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'

interface Section {
  id: number
  crn: string
  section_code: string
  course_title: string
}

interface TA {
  id: number
  email: string
  full_name: string
  ta_type: string
}

interface ExistingAssignment {
  id: number
  ta_id: number
  hours: number
  ta_name: string
  ta_email: string
  ta_type: string
}

interface Props {
  section: Section
  existingAssignments: ExistingAssignment[]
  availableTAs: TA[]
  userEmail: string
}

export default function TAAssignmentForm({ section, existingAssignments, availableTAs, userEmail }: Props) {
  const [assignments, setAssignments] = useState(existingAssignments)
  const [selectedTA, setSelectedTA] = useState('')
  const [hours, setHours] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTA || !hours) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/ta-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: section.id,
          ta_id: parseInt(selectedTA),
          hours: parseFloat(hours),
          assigned_by: userEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to assign TA')
      } else {
        const ta = availableTAs.find(t => t.id === parseInt(selectedTA))
        if (ta) {
          setAssignments(prev => [...prev, {
            id: data.id,
            ta_id: ta.id,
            hours: parseFloat(hours),
            ta_name: ta.full_name,
            ta_email: ta.email,
            ta_type: ta.ta_type,
          }])
        }
        setSelectedTA('')
        setHours('')
      }
    } catch {
      setError('Network error')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await fetch(`/api/ta-assignments/${id}`, { method: 'DELETE' })
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch {
      // ignore
    }
    setDeletingId(null)
  }

  const assignedTAIds = new Set(assignments.map(a => a.ta_id))
  const unassignedTAs = availableTAs.filter(ta => !assignedTAIds.has(ta.id))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">
          {section.section_code} — {section.course_title}
        </h3>
        <p className="text-xs text-gray-500">CRN: {section.crn}</p>
      </div>

      {assignments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="font-medium text-gray-700 text-sm">Current Assignments</h4>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Hours</th>
                <th className="px-4 py-3 text-left">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.ta_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.ta_email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.ta_type === 'GRAD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {a.ta_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{a.hours}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                    >
                      {deletingId === a.id ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="font-medium text-gray-700 text-sm mb-4">Add TA Assignment</h4>
        {unassignedTAs.length === 0 ? (
          <p className="text-sm text-gray-500">All available TAs are already assigned to this section.</p>
        ) : (
          <form onSubmit={handleAdd} className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">TA</label>
              <select
                value={selectedTA}
                onChange={(e) => setSelectedTA(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select TA...</option>
                {unassignedTAs.map(ta => (
                  <option key={ta.id} value={ta.id}>
                    {ta.full_name} ({ta.ta_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 10"
                min="1"
                max="40"
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Spinner size="sm" />}
              Assign
            </button>
          </form>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  )
}
