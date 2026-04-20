import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('section_id')
    const email = searchParams.get('email')

    if (email) {
      // TA self-service: get assignments by TA email
      const { data: ta } = await supabase
        .from('tas')
        .select('id')
        .eq('email', email)
        .single()

      if (!ta) return NextResponse.json([])

      const { data, error } = await supabase
        .from('ta_assignments')
        .select(`
          id, hours, assigned_at,
          sections (
            id, crn, section_code,
            courses ( title ),
            semesters ( term_label ),
            meeting_days, meeting_times,
            instructors ( full_name )
          )
        `)
        .eq('ta_id', ta.id)
        .order('assigned_at', { ascending: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      const mapped = (data ?? []).map((a: Record<string, unknown>) => {
        const sec = a.sections as Record<string, unknown>
        return {
          id: a.id,
          hours: a.hours,
          assigned_at: a.assigned_at,
          section: {
            id: sec?.id,
            crn: sec?.crn,
            section_code: sec?.section_code,
            course_title: (sec?.courses as Record<string, unknown>)?.title,
            semester_label: (sec?.semesters as Record<string, unknown>)?.term_label,
            meeting_days: sec?.meeting_days,
            meeting_times: sec?.meeting_times,
            instructor_name: (sec?.instructors as Record<string, unknown>)?.full_name,
          },
        }
      })
      return NextResponse.json(mapped)
    }

    if (sectionId) {
      const { data, error } = await supabase
        .from('ta_assignments')
        .select(`
          id, hours, assigned_at, assigned_by,
          tas ( id, email, full_name, ta_type )
        `)
        .eq('section_id', parseInt(sectionId))

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      const mapped = (data ?? []).map((a: Record<string, unknown>) => {
        const ta = a.tas as Record<string, unknown>
        return {
          id: a.id,
          ta_id: ta?.id,
          hours: a.hours,
          assigned_at: a.assigned_at,
          ta_name: ta?.full_name,
          ta_email: ta?.email,
          ta_type: ta?.ta_type,
        }
      })
      return NextResponse.json(mapped)
    }

    return NextResponse.json({ error: 'section_id or email required' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!['admin', 'chair', 'ta_coordinator'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { section_id, ta_id, hours } = body

    if (!section_id || !ta_id || !hours) {
      return NextResponse.json({ error: 'section_id, ta_id, and hours required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ta_assignments')
      .upsert(
        { section_id, ta_id, hours, assigned_by: user.id, assigned_at: new Date().toISOString() },
        { onConflict: 'section_id,ta_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
