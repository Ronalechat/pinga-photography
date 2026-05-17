import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseRequest, SupabaseRestError } from '@/lib/shop/supabaseRest'

const SESSION_COOKIE_NAME = 'pinga_shop_admin_session'
const CSRF_HEADER_NAME = 'x-pinga-shop-csrf'
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
const PIN_HASH_ITERATIONS = 210_000
const PIN_HASH_KEY_LENGTH = 32
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

interface AdminSessionPayload {
  username: string
  exp: number
}

interface AdminUserRow {
  username: string
  pin_hash: string
  pin_salt: string
  failed_attempts: number
  locked_until: string | null
}

interface AuthResult {
  ok: boolean
  setupRequired?: boolean
  locked?: boolean
  error?: string
  username?: string
}

interface AdminAuthOptions {
  requireCsrf?: boolean
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

function getSessionSecret() {
  return process.env.SHOP_ADMIN_SESSION_SECRET ?? ''
}

function getSetupSecret() {
  return process.env.SHOP_ADMIN_SETUP_SECRET ?? ''
}

function getAllowedUsernames() {
  return (process.env.SHOP_ADMIN_USERNAMES ?? '')
    .split(',')
    .map((username) => username.trim())
    .filter(Boolean)
}

function isAllowedUsername(username: string) {
  return getAllowedUsernames().includes(username)
}

function sanitizeUsername(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : ''
}

function sanitizePin(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getGenericAuthError() {
  return 'Login could not be verified.'
}

function signPayload(payload: string) {
  return base64Url(createHmac('sha256', getSessionSecret()).update(payload).digest())
}

function signCsrfToken(sessionCookie: string) {
  return base64Url(createHmac('sha256', getSessionSecret()).update(`csrf:${sessionCookie}`).digest())
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

function hashPin(pin: string, salt: string) {
  return pbkdf2Sync(pin, salt, PIN_HASH_ITERATIONS, PIN_HASH_KEY_LENGTH, 'sha256').toString('hex')
}

function getPinRecord(pin: string) {
  const salt = randomBytes(16).toString('hex')

  return {
    salt,
    hash: hashPin(pin, salt),
  }
}

function isValidPin(pin: string) {
  return /^\d{6}$/.test(pin)
}

function isLocked(row: AdminUserRow) {
  return Boolean(row.locked_until && new Date(row.locked_until).getTime() > Date.now())
}

function getLockoutUntil() {
  return new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
}

async function getAdminUser(username: string) {
  const rows = await supabaseRequest<AdminUserRow[]>(
    `/rest/v1/shop_admin_users?username=eq.${encodeURIComponent(username)}&select=username,pin_hash,pin_salt,failed_attempts,locked_until&limit=1`
  )

  return rows[0] ?? null
}

async function createAdminUser(username: string, pin: string) {
  const record = getPinRecord(pin)

  await supabaseRequest('/rest/v1/shop_admin_users', {
    method: 'POST',
    body: {
      username,
      pin_hash: record.hash,
      pin_salt: record.salt,
      failed_attempts: 0,
      locked_until: null,
      setup_completed_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    },
  })
}

async function recordLoginSuccess(username: string) {
  await supabaseRequest(`/rest/v1/shop_admin_users?username=eq.${encodeURIComponent(username)}`, {
    method: 'PATCH',
    body: {
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    },
  })
}

async function recordLoginFailure(row: AdminUserRow) {
  const failedAttempts = row.failed_attempts + 1

  await supabaseRequest(`/rest/v1/shop_admin_users?username=eq.${encodeURIComponent(row.username)}`, {
    method: 'PATCH',
    body: {
      failed_attempts: failedAttempts,
      locked_until: failedAttempts >= MAX_FAILED_ATTEMPTS ? getLockoutUntil() : null,
    },
  })
}

export function getAdminAuthSetupStatus() {
  const requiredItems = [
    {
      key: 'admin-usernames',
      label: 'Shop admin usernames',
      configured: getAllowedUsernames().length > 0,
    },
    {
      key: 'admin-session-secret',
      label: 'Shop admin session secret',
      configured: Boolean(getSessionSecret()),
    },
    {
      key: 'admin-setup-secret',
      label: 'Shop admin setup secret',
      configured: Boolean(getSetupSecret()),
    },
  ]

  return {
    ready: requiredItems.every((item) => item.configured),
    items: requiredItems,
    missing: requiredItems.filter((item) => !item.configured).map((item) => item.label),
  }
}

export function createAdminSessionCookie(username: string) {
  const payload: AdminSessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }
  const encodedPayload = base64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function createAdminCsrfToken(sessionCookie: string) {
  return signCsrfToken(sessionCookie)
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: true,
  })
}

export function setAdminSessionCookie(
  response: NextResponse,
  username: string,
  sessionCookie = createAdminSessionCookie(username)
) {
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: true,
  })

  return sessionCookie
}

export function getAdminSession(req: NextRequest) {
  const secret = getSessionSecret()
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!secret || !cookie) return null

  const [encodedPayload, signature] = cookie.split('.')
  if (!encodedPayload || !signature || !safeEqual(signPayload(encodedPayload), signature)) return null

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as AdminSessionPayload

    if (!payload.username || !isAllowedUsername(payload.username)) return null
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export function getAdminCsrfToken(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!cookie || !getAdminSession(req)) return null

  return createAdminCsrfToken(cookie)
}

export function verifyAdminCsrf(req: NextRequest) {
  const token = req.headers.get(CSRF_HEADER_NAME)
  const expectedToken = getAdminCsrfToken(req)

  if (!token || !expectedToken) return false

  return safeEqual(token, expectedToken)
}

export function getAdminAuthError(req: NextRequest, options: AdminAuthOptions = {}) {
  const setup = getAdminAuthSetupStatus()

  if (!setup.ready) {
    return NextResponse.json({
      error: 'Shop admin login is not configured.',
      setupRequired: true,
      missing: setup.missing,
    }, { status: 501 })
  }

  if (!getAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (options.requireCsrf && !verifyAdminCsrf(req)) {
    return NextResponse.json({ error: 'Admin request could not be verified.' }, { status: 403 })
  }

  return null
}

export async function verifyAdminPinLogin(input: {
  username: unknown
  pin: unknown
  setupSecret?: unknown
}): Promise<AuthResult> {
  const username = sanitizeUsername(input.username)
  const pin = sanitizePin(input.pin)
  const setupSecret = typeof input.setupSecret === 'string' ? input.setupSecret : ''
  const setup = getAdminAuthSetupStatus()

  if (!setup.ready) {
    return { ok: false, error: 'Shop admin login is not configured.' }
  }

  if (!isAllowedUsername(username) || !isValidPin(pin)) {
    return { ok: false, error: getGenericAuthError() }
  }

  try {
    const row = await getAdminUser(username)

    if (!row) {
      if (!setupSecret || !safeEqual(setupSecret, getSetupSecret())) {
        return {
          ok: false,
          setupRequired: true,
          error: getGenericAuthError(),
        }
      }

      await createAdminUser(username, pin)

      return { ok: true, username }
    }

    if (isLocked(row)) {
      return {
        ok: false,
        locked: true,
        error: 'Too many attempts. Try again later.',
      }
    }

    if (!safeEqual(hashPin(pin, row.pin_salt), row.pin_hash)) {
      await recordLoginFailure(row)
      return { ok: false, error: getGenericAuthError() }
    }

    await recordLoginSuccess(username)

    return { ok: true, username }
  } catch (error) {
    if (error instanceof SupabaseRestError && error.status === 404) {
      return {
        ok: false,
        setupRequired: true,
        error: 'Shop admin user table is not installed.',
      }
    }

    return { ok: false, error: 'Shop admin login could not be checked.' }
  }
}
