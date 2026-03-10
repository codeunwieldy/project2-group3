import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstructorWorkload } from '@/lib/queries/workload'

export async function GET() {
  try {
    const supabase = await createClient()
    const data = await getInstructorWorkload(supabase)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
