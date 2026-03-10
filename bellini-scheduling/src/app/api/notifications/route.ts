import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'pending'
    const limit = parseInt(searchParams.get('limit') ?? '50')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', status)
      .order('id', { ascending: true })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { ids, status } = body

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ error: 'ids and status required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('notifications')
      .update({ status, sent_at: status === 'sent' ? new Date().toISOString() : null })
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ updated: ids.length })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
