// @ts-nocheck
// Deno Edge Function — runs on Supabase's Deno runtime, not Node.js.
// URL imports and Deno globals are valid here; ts-nocheck suppresses VS Code Node TS errors.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface Notification {
  id: number
  recipient_email: string
  subject: string
  body: string
}

async function sendEmail(notification: Notification): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Bellini Scheduling <noreply@bellini.edu>',
      to: [notification.recipient_email],
      subject: notification.subject,
      html: `<p>${notification.body.replace(/\n/g, '<br>')}</p>`,
    }),
  })
  return res.ok
}

serve(async (_req) => {
  try {
    // Fetch up to 50 pending notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, recipient_email, subject, body')
      .eq('status', 'pending')
      .order('id', { ascending: true })
      .limit(50)

    if (error) throw error
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const results = await Promise.allSettled(
      notifications.map(async (n: Notification) => {
        const ok = await sendEmail(n)
        await supabase
          .from('notifications')
          .update({
            status: ok ? 'sent' : 'failed',
            sent_at: ok ? new Date().toISOString() : null,
          })
          .eq('id', n.id)
        return { id: n.id, ok }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as { ok: boolean }).ok).length
    const failed = results.length - sent

    return new Response(
      JSON.stringify({ processed: results.length, sent, failed }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
