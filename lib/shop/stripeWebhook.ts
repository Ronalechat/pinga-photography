import { createHmac, timingSafeEqual } from 'node:crypto'

const STRIPE_TOLERANCE_SECONDS = 5 * 60

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: unknown
  }
}

function parseStripeSignature(signatureHeader: string) {
  const parts = signatureHeader.split(',')
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))

  return {
    timestamp,
    signatures,
  }
}

function secureCompare(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, 'hex')
  const actualBuffer = Buffer.from(actual, 'hex')

  if (expectedBuffer.length !== actualBuffer.length) return false

  return timingSafeEqual(expectedBuffer, actualBuffer)
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader)

  if (!timestamp || signatures.length === 0) return false

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds)) return false

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds)
  if (ageSeconds > STRIPE_TOLERANCE_SECONDS) return false

  const signedPayload = `${timestamp}.${rawBody}`
  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  return signatures.some((signature) => secureCompare(expectedSignature, signature))
}

export function parseStripeWebhookEvent(rawBody: string): StripeWebhookEvent | null {
  const parsed = JSON.parse(rawBody) as unknown

  if (!parsed || typeof parsed !== 'object') return null
  if (!('id' in parsed) || typeof parsed.id !== 'string') return null
  if (!('type' in parsed) || typeof parsed.type !== 'string') return null
  if (!('data' in parsed) || !parsed.data || typeof parsed.data !== 'object') return null
  if (!('object' in parsed.data)) return null

  return {
    id: parsed.id,
    type: parsed.type,
    data: {
      object: parsed.data.object,
    },
  }
}
