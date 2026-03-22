import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email, phone, occasions, date, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

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
