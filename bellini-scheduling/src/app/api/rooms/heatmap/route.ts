import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRoomHeatmapData } from '@/lib/queries/rooms'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semester_id') ? parseInt(searchParams.get('semester_id')!) : null
    const roomId = searchParams.get('room_id') ? parseInt(searchParams.get('room_id')!) : undefined

    if (!semesterId) return NextResponse.json({ error: 'semester_id required' }, { status: 400 })

    const data = await getRoomHeatmapData(supabase, semesterId, roomId)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
