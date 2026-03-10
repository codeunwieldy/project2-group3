import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSections } from '@/lib/queries/sections'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const semesterId = searchParams.get('semester_id')
      ? parseInt(searchParams.get('semester_id')!)
      : undefined
    const crn = searchParams.get('crn') ?? undefined
    const instructorId = searchParams.get('instructor_id')
      ? parseInt(searchParams.get('instructor_id')!)
      : undefined
    const subject = searchParams.get('subject') ?? undefined
    const courseNumber = searchParams.get('course_number') ?? undefined

    // If subject + course_number provided, use course search
    if (subject && courseNumber) {
      const { searchCourse } = await import('@/lib/queries/sections')
      const sections = await searchCourse(supabase, subject, courseNumber)
      return NextResponse.json(sections)
    }

    const sections = await getSections(supabase, { semesterId, crn, instructorId })
    return NextResponse.json(sections)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Role check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'chair', 'ta_coordinator'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('sections')
      .insert({ ...body, created_by: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
