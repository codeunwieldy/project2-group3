import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSectionById } from '@/lib/queries/sections'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const section = await getSectionById(supabase, parseInt(id))

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role check
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'chair', 'ta_coordinator'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Build the update payload, resolving related entity IDs as needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {}

    // Scalar section fields
    if (body.crn !== undefined) updatePayload.crn = body.crn
    if (body.section_code !== undefined) updatePayload.section_code = body.section_code
    if (body.course_level !== undefined) updatePayload.course_level = body.course_level
    if (body.meeting_days !== undefined) updatePayload.meeting_days = body.meeting_days
    if (body.meeting_times !== undefined) updatePayload.meeting_times = body.meeting_times
    if (body.enrollment !== undefined) updatePayload.enrollment = body.enrollment
    if (body.semester_id !== undefined) updatePayload.semester_id = body.semester_id

    // Parse meeting_times into start/end if provided (format: "HH:MM-HH:MM")
    if (body.meeting_times) {
      const match = String(body.meeting_times).match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/)
      if (match) {
        updatePayload.meeting_time_start = match[1]
        updatePayload.meeting_time_end = match[2]
      }
    }

    // Resolve course_id from subject + course_number + course_title
    if (body.subject && body.course_number) {
      // Find or create subject
      let subjectId: number | null = null
      const { data: existingSubject } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', body.subject.toUpperCase())
        .single()

      if (existingSubject) {
        subjectId = existingSubject.id
      } else {
        const { data: newSubject, error: subjectErr } = await supabase
          .from('subjects')
          .insert({ code: body.subject.toUpperCase() })
          .select('id')
          .single()
        if (subjectErr) {
          return NextResponse.json({ error: `Subject error: ${subjectErr.message}` }, { status: 400 })
        }
        subjectId = newSubject.id
      }

      // Find or create course
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('course_number', body.course_number)
        .single()

      if (existingCourse) {
        updatePayload.course_id = existingCourse.id
        // Update title/level if changed
        await supabase
          .from('courses')
          .update({
            ...(body.course_title ? { title: body.course_title } : {}),
            ...(body.course_level ? { course_level: body.course_level } : {}),
          })
          .eq('id', existingCourse.id)
      } else {
        const { data: newCourse, error: courseErr } = await supabase
          .from('courses')
          .insert({
            subject_id: subjectId,
            course_number: body.course_number,
            title: body.course_title ?? body.course_number,
            course_level: body.course_level ?? null,
          })
          .select('id')
          .single()
        if (courseErr) {
          return NextResponse.json({ error: `Course error: ${courseErr.message}` }, { status: 400 })
        }
        updatePayload.course_id = newCourse.id
      }
    }

    // Resolve instructor_id from instructor_email
    if (body.instructor_email) {
      const { data: existingInstructor } = await supabase
        .from('instructors')
        .select('id')
        .eq('email', body.instructor_email)
        .single()

      if (existingInstructor) {
        updatePayload.instructor_id = existingInstructor.id
        // Update name if provided
        if (body.instructor_name) {
          await supabase
            .from('instructors')
            .update({ full_name: body.instructor_name })
            .eq('id', existingInstructor.id)
        }
      } else {
        const { data: newInstructor, error: instrErr } = await supabase
          .from('instructors')
          .insert({
            email: body.instructor_email,
            full_name: body.instructor_name ?? null,
          })
          .select('id')
          .single()
        if (instrErr) {
          return NextResponse.json({ error: `Instructor error: ${instrErr.message}` }, { status: 400 })
        }
        updatePayload.instructor_id = newInstructor.id
      }
    } else if (body.instructor_email === null || body.instructor_email === '') {
      updatePayload.instructor_id = null
    }

    // Resolve room_id from room_code
    if (body.room_code) {
      const { data: existingRoom } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', body.room_code)
        .single()

      if (existingRoom) {
        updatePayload.room_id = existingRoom.id
      } else {
        const { data: newRoom, error: roomErr } = await supabase
          .from('rooms')
          .insert({ room_code: body.room_code, is_online: false })
          .select('id')
          .single()
        if (roomErr) {
          return NextResponse.json({ error: `Room error: ${roomErr.message}` }, { status: 400 })
        }
        updatePayload.room_id = newRoom.id
      }
    } else if (body.room_code === null || body.room_code === '') {
      updatePayload.room_id = null
    }

    // Perform the update
    const { data, error } = await supabase
      .from('sections')
      .update(updatePayload)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role check — only admin or chair can delete
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'chair'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
