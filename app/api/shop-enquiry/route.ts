import { createSign } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)
const VALID_SIZES = new Set(['Small', 'Medium', 'Large', 'X-Large'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s+\-(). ]*$/

function sanitize(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/<[^>]*>/g, '').trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function getPrivateKey(): string {
  return (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
}

async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = getPrivateKey()

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const unsignedToken = `${header}.${payload}`
  const signature = createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(privateKey)
  const assertion = `${unsignedToken}.${base64Url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!res.ok) {
    throw new Error(`Google auth failed with ${res.status}`)
  }

  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('Google auth response missing access_token')
  return data.access_token
}

async function appendToSheet(values: string[]) {
  const sheetId = process.env.GOOGLE_SHEET_ID
  const range = process.env.GOOGLE_SHEET_RANGE || 'Shop Enquiries!A:G'

  if (!sheetId) throw new Error('Missing GOOGLE_SHEET_ID')

  const token = await getGoogleAccessToken()
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append`)
  url.searchParams.set('valueInputOption', 'USER_ENTERED')
  url.searchParams.set('insertDataOption', 'INSERT_ROWS')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [values] }),
  })

  if (!res.ok) {
    throw new Error(`Google Sheets append failed with ${res.status}`)
  }
}

function validateBody(body: Record<string, unknown>): string | null {
  const productName = sanitize(body.productName)
  const productPrice = sanitize(body.productPrice)
  const name = sanitize(body.name)
  const email = sanitize(body.email)
  const phone = sanitize(body.phone)
  const size = sanitize(body.size)
  const quantity = Number(body.quantity)

  if (!productName) return 'Product is required'
  if (productName.length > 160) return 'Product name must be 160 characters or fewer'
  if (productPrice.length > 80) return 'Product price must be 80 characters or fewer'
  if (!name) return 'Name is required'
  if (name.length > 120) return 'Name must be 120 characters or fewer'
  if (!email) return 'Email is required'
  if (!EMAIL_RE.test(email)) return 'Email address is invalid'
  if (phone && !PHONE_RE.test(phone)) return 'Phone number contains invalid characters'
  if (phone.length > 30) return 'Phone number must be 30 characters or fewer'
  if (!VALID_SIZES.has(size)) return 'Size is invalid'
  if (!Number.isInteger(quantity) || quantity < 1) {
    return 'Quantity must be at least 1'
  }

  return null
}

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

  const productName = sanitize(body.productName)
  const productPrice = sanitize(body.productPrice)
  const name = sanitize(body.name)
  const email = sanitize(body.email)
  const phone = sanitize(body.phone)
  const size = sanitize(body.size)
  const quantity = String(Number(body.quantity))
  const submittedAt = new Date().toISOString()
  const safeProduct = escapeHtml(productName)
  const safeProductPrice = escapeHtml(productPrice)
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePhone = escapeHtml(phone)
  const safeSize = escapeHtml(size)
  const safeQuantity = escapeHtml(quantity)

  try {
    await resend.emails.send({
      from: process.env.SENDER_EMAIL as string,
      to: process.env.RECIPIENT_EMAIL as string,
      replyTo: email,
      subject: `Shirt enquiry — ${name}`,
      html: `
        <table style="font-family: Georgia, serif; font-size: 15px; color: #1a1a1a; max-width: 600px; width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 32px 32px 0; font-family: sans-serif; font-size: 22px; font-weight: bold; color: #16161D; background: #f5f5f5;">New shirt enquiry</td></tr>
          <tr><td style="padding: 24px 32px 32px; background: #f5f5f5;">
            <table style="width:100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; width: 140px; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Product</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${safeProduct}</td></tr>
              ${safeProductPrice ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Price</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${safeProductPrice}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Name</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${safeName}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${safeEmail}" style="color: #3A3A6E;">${safeEmail}</a></td></tr>
              ${safePhone ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Phone</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${safePhone}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Size</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${safeSize}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Quantity</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${safeQuantity}</td></tr>
            </table>
          </td></tr>
        </table>
      `,
    })
  } catch (err) {
    console.error('[shop-enquiry] email send failed', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  try {
    await appendToSheet([submittedAt, productName, name, email, phone, size, quantity])
  } catch (err) {
    console.error('[shop-enquiry] sheet append failed', err)
  }

  return NextResponse.json({ ok: true })
}
