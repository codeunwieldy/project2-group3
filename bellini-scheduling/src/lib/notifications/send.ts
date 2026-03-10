import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: options.from ?? 'Bellini Scheduling <noreply@bellini.edu>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Email send failed:', msg)
    return { success: false, error: msg }
  }
}
