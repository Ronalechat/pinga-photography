import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s+\-().]*$/

/** Strip HTML tags to prevent injection into the email template */
function sanitize(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/<[^>]*>/g, '').trim()
}

function validateBody(body: Record<string, unknown>): string | null {
  const name    = sanitize(body.name)
  const email   = sanitize(body.email)
  const message = sanitize(body.message)
  const phone   = sanitize(body.phone)

  if (!name)                         return 'Name is required'
  if (name.length > 120)             return 'Name must be 120 characters or fewer'
  if (!email)                        return 'Email is required'
  if (!EMAIL_RE.test(email))         return 'Email address is invalid'
  if (!message)                      return 'Message is required'
  if (message.length > 5000)         return 'Message must be 5000 characters or fewer'
  if (phone && !PHONE_RE.test(phone)) return 'Phone number contains invalid characters'
  if (phone && phone.length > 30)    return 'Phone number must be 30 characters or fewer'

  return null
}

// ─── Allowed occasions ────────────────────────────────────────────────────────

const VALID_OCCASIONS = new Set(['Street', 'Engagement', 'Pregnancy', 'Birthday', 'Exhibition', 'Portrait'])

function validateOccasions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((o): o is string => typeof o === 'string' && VALID_OCCASIONS.has(o))
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const validationError = validateBody(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const name      = sanitize(body.name)
  const email     = sanitize(body.email)
  const message   = sanitize(body.message)
  const phone     = sanitize(body.phone)
  const date      = sanitize(body.date)
  const occasions = validateOccasions(body.occasions)

  const html = `
    <table style="font-family: Georgia, serif; font-size: 15px; color: #1a1a1a; max-width: 600px; width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 32px 32px 0; font-family: sans-serif; font-size: 22px; font-weight: bold; color: #16161D; background: #f5f5f5;">New enquiry from ${name}</td></tr>
      <tr><td style="padding: 24px 32px; background: #f5f5f5;">
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; width: 140px; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Name</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${name}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${email}" style="color: #3A3A6E;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Phone</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${phone}</td></tr>` : ''}
          ${occasions?.length ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Occasion</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${occasions}</td></tr>` : ''}
          ${date ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${date}</td></tr>` : ''}
        </table>
      </td></tr>
      <tr><td style="padding: 24px 32px 32px; background: #f5f5f5;">
        <p style="margin: 0 0 8px; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Message</p>
        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
      </td></tr>
    </table>
  `

  try {
    await resend.emails.send({
      from: process.env.SENDER_EMAIL as string,
      to: process.env.RECIPIENT_EMAIL as string,
      replyTo: email,
      subject: `Enquiry — ${name}`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[enquiry] email send failed', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
