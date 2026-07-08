import { NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/lib/shop/adminAuth'

export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  clearAdminSessionCookie(response)

  return response
}
