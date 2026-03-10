import { createClient } from '@/lib/supabase/server'
import { getRooms } from '@/lib/queries/rooms'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

export default async function RoomsPage() {
  const supabase = await createClient()
  const rooms = await getRooms(supabase)

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rooms</h2>
          <p className="text-sm text-gray-500 mt-0.5">All classrooms and meeting spaces</p>
        </div>
        <Link
          href="/rooms/heatmap"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          View Heatmap
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Room Code</th>
              <th className="px-4 py-3 text-left">Building</th>
              <th className="px-4 py-3 text-left">Room #</th>
              <th className="px-4 py-3 text-right">Capacity</th>
              <th className="px-4 py-3 text-left">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No rooms found.
                </td>
              </tr>
            ) : (
              rooms.map((room: Record<string, unknown>) => (
                <tr key={room.id as number} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{room.room_code as string}</td>
                  <td className="px-4 py-3 text-gray-700">{room.building as string ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{room.room_number as string ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">{room.capacity as number ?? '—'}</td>
                  <td className="px-4 py-3">
                    {room.is_online ? (
                      <Badge variant="info">Online</Badge>
                    ) : (
                      <Badge variant="default">In-Person</Badge>
                    )}
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
