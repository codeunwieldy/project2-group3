import { createClient } from '@/lib/supabase/server'
import { getRooms } from '@/lib/queries/rooms'
import RoomHeatmap from '@/components/rooms/RoomHeatmap'

export default async function RoomHeatmapPage() {
  const supabase = await createClient()

  const { data: semesters } = await supabase
    .from('semesters')
    .select('id, code, term_label')
    .order('id', { ascending: false })

  const rooms = await getRooms(supabase)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Room Utilization Heatmap</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Weekly occupied vs available time blocks per room
        </p>
      </div>
      <RoomHeatmap semesters={semesters ?? []} rooms={rooms} />
    </div>
  )
}
