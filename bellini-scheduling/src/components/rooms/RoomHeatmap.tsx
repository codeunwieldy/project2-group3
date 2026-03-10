'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/Spinner'

interface HeatmapCell {
  roomCode: string
  day: string
  slotStart: string
  slotEnd: string
  occupied: boolean
  sectionInfo?: {
    id: number
    crn: string
    course: string
    instructor: string | null
    enrollment: number | null
  }
}

interface Semester {
  id: number
  code: string
  term_label: string
}

interface Room {
  id: number
  room_code: string
  [key: string]: unknown
}

interface Props {
  semesters: Semester[]
  rooms: Room[]
}

const DAYS = ['M', 'T', 'W', 'R', 'F']
const DAY_LABELS: Record<string, string> = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri' }

export default function RoomHeatmap({ semesters, rooms }: Props) {
  const [selectedRoom, setSelectedRoom] = useState<number>(rooms[0]?.id ?? 0)
  const [selectedSemester, setSelectedSemester] = useState<number>(semesters[0]?.id ?? 0)
  const [data, setData] = useState<HeatmapCell[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null)

  useEffect(() => {
    if (!selectedRoom || !selectedSemester) return
    setLoading(true)
    fetch(`/api/rooms/heatmap?semester_id=${selectedSemester}&room_id=${selectedRoom}`)
      .then(r => r.json())
      .then(d => {
        setData(Array.isArray(d) ? d : [])
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [selectedRoom, selectedSemester])

  // Build lookup map
  const cellMap = new Map<string, HeatmapCell>()
  data.forEach(cell => {
    cellMap.set(`${cell.day}-${cell.slotStart}`, cell)
  })

  // Collect all unique time slots
  const allSlots = [...new Set(data.map(d => d.slotStart))].sort()

  const currentRoom = rooms.find(r => r.id === selectedRoom)
  const occupiedCount = data.filter(d => d.occupied).length
  const totalSlots = data.length
  const utilization = totalSlots > 0 ? Math.round((occupiedCount / totalSlots) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Semester:</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.term_label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Room:</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.room_code as string}</option>
            ))}
          </select>
        </div>
        {!loading && currentRoom && data.length > 0 && (
          <div className="text-sm text-gray-500">
            Utilization: <span className="font-semibold text-blue-700">{utilization}%</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-600"></div>
          <span className="text-gray-600">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
          <span className="text-gray-600">Free</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Spinner size="sm" /> Loading heatmap...
        </div>
      )}

      {!loading && data.length === 0 && selectedRoom && selectedSemester && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No scheduled sections found for this room/semester combination.
        </div>
      )}

      {!loading && allSlots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-auto">
          <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `64px repeat(${DAYS.length}, minmax(64px, 1fr))` }}>
            {/* Header row */}
            <div className="text-xs text-gray-400 py-1 pr-2 text-right font-medium">Time</div>
            {DAYS.map(day => (
              <div key={day} className="text-xs font-medium text-center text-gray-600 py-1">
                {DAY_LABELS[day]}
              </div>
            ))}

            {/* Data rows */}
            {allSlots.map(slot => (
              <>
                <div key={`label-${slot}`} className="text-xs text-gray-400 pr-2 text-right flex items-center justify-end">
                  {slot.endsWith(':00') ? slot : ''}
                </div>
                {DAYS.map(day => {
                  const cell = cellMap.get(`${day}-${slot}`)
                  const occupied = cell?.occupied ?? false
                  return (
                    <div
                      key={`${day}-${slot}`}
                      className={`h-5 rounded-sm cursor-pointer transition-opacity ${
                        occupied
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                      }`}
                      onMouseEnter={() => setHoveredCell(cell ?? null)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={occupied && cell ? `${cell.sectionInfo?.course}: ${cell.sectionInfo?.instructor ?? 'No instructor'}` : 'Free'}
                    />
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {hoveredCell && hoveredCell.occupied && hoveredCell.sectionInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <span className="font-medium text-blue-800">{hoveredCell.sectionInfo.course}</span>
          {hoveredCell.sectionInfo.instructor && (
            <span className="text-blue-600 ml-2">— {hoveredCell.sectionInfo.instructor}</span>
          )}
          {hoveredCell.sectionInfo.enrollment !== null && (
            <span className="text-blue-400 ml-2 text-xs">({hoveredCell.sectionInfo.enrollment} enrolled)</span>
          )}
          <span className="text-blue-400 ml-2 text-xs">{DAY_LABELS[hoveredCell.day]} {hoveredCell.slotStart}</span>
        </div>
      )}
    </div>
  )
}
