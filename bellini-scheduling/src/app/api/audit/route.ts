import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDuplicateCRNs, getRoomOverlaps, getInstructorOverlaps, getUnreasonableTimes } from '@/lib/queries/audit'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const semesterIdStr = searchParams.get('semester_id')
    const semesterId = semesterIdStr ? parseInt(semesterIdStr) : null

    if (!semesterId) return NextResponse.json({ error: 'semester_id required' }, { status: 400 })

    switch (type) {
      case 'duplicate_crns':
        return NextResponse.json(await getDuplicateCRNs(supabase, semesterId))
      case 'room_overlaps':
        return NextResponse.json(await getRoomOverlaps(supabase, semesterId))
      case 'instructor_overlaps':
        return NextResponse.json(await getInstructorOverlaps(supabase, semesterId))
      case 'unreasonable_times':
        return NextResponse.json(await getUnreasonableTimes(supabase, semesterId))
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
