import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { generateTimeSlots } from '@/lib/utils/time'
import { expandDays } from '@/lib/utils/days'

export interface HeatmapCell {
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

export async function getRoomHeatmapData(
  supabase: SupabaseClient<Database>,
  semesterId: number,
  roomId?: number
): Promise<HeatmapCell[]> {
  let query = supabase
    .from('sections')
    .select(`
      id, crn, meeting_days, meeting_time_start, meeting_time_end, enrollment,
      rooms(id, room_code),
      courses(course_number, subjects(code)),
      instructors(full_name)
    `)
    .eq('semester_id', semesterId)
    .not('meeting_time_start', 'is', null)
    .not('room_id', 'is', null)

  if (roomId) query = query.eq('room_id', roomId)

  const { data: sections, error } = await query
  if (error) throw new Error(error.message)

  // Get all rooms in this semester
  const { data: allRooms } = await supabase
    .from('rooms')
    .select('id, room_code')
    .order('room_code')

  const rooms = roomId
    ? allRooms?.filter((r) => r.id === roomId) ?? []
    : allRooms ?? []

  const timeSlots = generateTimeSlots(7, 22)
  const weekDays = ['M', 'T', 'W', 'R', 'F']

  const cells: HeatmapCell[] = []

  for (const room of rooms) {
    for (const day of weekDays) {
      for (let i = 0; i < timeSlots.length - 1; i++) {
        const slotStart = timeSlots[i]
        const slotEnd = timeSlots[i + 1]

        // Find a section occupying this slot
        const occupying = (sections ?? []).find((s) => {
          const sRoom = s.rooms as unknown as { id: number; room_code: string } | null
          if (!sRoom || sRoom.id !== room.id) return false
          if (!s.meeting_days || !s.meeting_time_start || !s.meeting_time_end) return false
          const days = expandDays(s.meeting_days)
          if (!days.includes(day as 'M' | 'T' | 'W' | 'R' | 'F')) return false
          return s.meeting_time_start <= slotStart && s.meeting_time_end > slotStart
        })

        const course = occupying
          ? (occupying.courses as unknown as { course_number: string; subjects: { code: string } } | null)
          : null
        const instructor = occupying
          ? (occupying.instructors as unknown as { full_name: string | null } | null)
          : null

        cells.push({
          roomCode: room.room_code,
          day,
          slotStart,
          slotEnd,
          occupied: !!occupying,
          sectionInfo: occupying
            ? {
                id: occupying.id,
                crn: occupying.crn,
                course: course ? `${course.subjects.code} ${course.course_number}` : '?',
                instructor: instructor?.full_name ?? null,
                enrollment: occupying.enrollment,
              }
            : undefined,
        })
      }
    }
  }

  return cells
}

export async function getRooms(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_code')
  if (error) throw new Error(error.message)
  return data ?? []
}
