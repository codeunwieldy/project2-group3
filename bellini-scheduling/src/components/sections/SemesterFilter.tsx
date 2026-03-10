'use client'

interface SemesterFilterProps {
  semesters: { id: number; code: string; term_label: string }[]
  selectedId: number | null
  onChange: (id: number) => void
}

export default function SemesterFilter({ semesters, selectedId, onChange }: SemesterFilterProps) {
  return (
    <select
      value={selectedId ?? ''}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      <option value="">All Semesters</option>
      {semesters.map((sem) => (
        <option key={sem.id} value={sem.id}>
          {sem.term_label} ({sem.code})
        </option>
      ))}
    </select>
  )
}
