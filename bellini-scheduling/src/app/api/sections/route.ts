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

    if (!body.semester_id || !body.crn || !body.section_code || !body.subject || !body.course_number) {
      return NextResponse.json(
        { error: 'semester_id, crn, section_code, subject, and course_number are required' },
        { status: 400 }
      )
    }

    // Resolve subject_id (find or create)
    let subjectId: number
    {
      const code = String(body.subject).toUpperCase()
      const { data: existing } = await supabase.from('subjects').select('id').eq('code', code).single()
      if (existing) {
        subjectId = existing.id
      } else {
        const { data: created, error: err } = await supabase
          .from('subjects')
          .insert({ code })
          .select('id')
          .single()
        if (err) return NextResponse.json({ error: `Subject error: ${err.message}` }, { status: 400 })
        subjectId = created.id
      }
    }

    // Resolve course_id (find or create)
    let courseId: number
    {
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('course_number', body.course_number)
        .single()
      if (existing) {
        courseId = existing.id
        if (body.course_title || body.course_level) {
          await supabase
            .from('courses')
            .update({
              ...(body.course_title ? { title: body.course_title } : {}),
              ...(body.course_level ? { course_level: body.course_level } : {}),
            })
            .eq('id', existing.id)
        }
      } else {
        const { data: created, error: err } = await supabase
          .from('courses')
          .insert({
            subject_id: subjectId,
            course_number: body.course_number,
            title: body.course_title ?? body.course_number,
            course_level: body.course_level ?? null,
          })
          .select('id')
          .single()
        if (err) return NextResponse.json({ error: `Course error: ${err.message}` }, { status: 400 })
        courseId = created.id
      }
    }

    // Resolve instructor_id (optional)
    let instructorId: number | null = null
    if (body.instructor_email) {
      const { data: existing } = await supabase
        .from('instructors')
        .select('id')
        .eq('email', body.instructor_email)
        .single()
      if (existing) {
        instructorId = existing.id
        if (body.instructor_name) {
          await supabase.from('instructors').update({ full_name: body.instructor_name }).eq('id', existing.id)
        }
      } else {
        const { data: created, error: err } = await supabase
          .from('instructors')
          .insert({ email: body.instructor_email, full_name: body.instructor_name ?? null })
          .select('id')
          .single()
        if (err) return NextResponse.json({ error: `Instructor error: ${err.message}` }, { status: 400 })
        instructorId = created.id
      }
    }

    // Resolve room_id (optional)
    let roomId: number | null = null
    if (body.room_code) {
      const { data: existing } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', body.room_code)
        .single()
      if (existing) {
        roomId = existing.id
      } else {
        const { data: created, error: err } = await supabase
          .from('rooms')
          .insert({ room_code: body.room_code, is_online: false })
          .select('id')
          .single()
        if (err) return NextResponse.json({ error: `Room error: ${err.message}` }, { status: 400 })
        roomId = created.id
      }
    }

    // Parse meeting_times "HH:MM-HH:MM" into start/end
    let meetingTimeStart: string | null = null
    let meetingTimeEnd: string | null = null
    if (body.meeting_times) {
      const match = String(body.meeting_times).match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/)
      if (match) {
        meetingTimeStart = match[1]
        meetingTimeEnd = match[2]
      }
    }

    const { data, error } = await supabase
      .from('sections')
      .insert({
        semester_id: body.semester_id,
        course_id: courseId,
        crn: body.crn,
        section_code: body.section_code,
        course_level: body.course_level ?? null,
        meeting_days: body.meeting_days ?? null,
        meeting_times: body.meeting_times ?? null,
        meeting_time_start: meetingTimeStart,
        meeting_time_end: meetingTimeEnd,
        room_id: roomId,
        instructor_id: instructorId,
        enrollment: body.enrollment ?? null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
