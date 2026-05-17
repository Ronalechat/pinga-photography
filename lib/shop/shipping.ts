import type { CartLine, ShippingProfile } from '@/lib/shop/types'
import { hasSupabaseConfig, supabaseRequest } from '@/lib/shop/supabaseRest'

export type ShippingDestination = {
  country: string
  postcode?: string
}

export type ShippingOptionKind = 'delivery' | 'pickup' | 'manual_quote'

export interface ShippingOption {
  id: string
  kind: ShippingOptionKind
  label: string
  amountCents: number
  currency: string
  description?: string
}

export interface ShippingQuote {
  currency: string
  options: ShippingOption[]
  requiresManualQuote: boolean
  message?: string
  profileSource?: ShippingProfileSource
}

export type ShippingProfileSource = 'default' | 'supabase'

export interface ShippingRule {
  baseCents: number
  additionalCents: number
  manualQuote?: boolean
  label: string
}

export type ShippingProfileRules = Record<ShippingProfile, ShippingRule>

export interface ShippingProfileReadModel {
  source: ShippingProfileSource
  rules: ShippingProfileRules
}

interface ShippingProfileRow {
  profile_key: unknown
  label: string
  base_cents: number
  additional_cents: number
  manual_quote: boolean
}

interface ValidShippingProfileRow extends ShippingProfileRow {
  profile_key: ShippingProfile
}

const DEFAULT_CURRENCY = 'AUD'

const DEFAULT_SHIPPING_RULES: ShippingProfileRules = {
  shirt: {
    baseCents: 1200,
    additionalCents: 300,
    label: 'Standard parcel',
  },
  unframed_print: {
    baseCents: 1800,
    additionalCents: 500,
    label: 'Print parcel',
  },
  framed_print: {
    baseCents: 3500,
    additionalCents: 1000,
    label: 'Framed print parcel',
  },
  oversized: {
    baseCents: 0,
    additionalCents: 0,
    manualQuote: true,
    label: 'Oversized freight',
  },
  pickup_only: {
    baseCents: 0,
    additionalCents: 0,
    label: 'Pickup only',
  },
  manual_quote: {
    baseCents: 0,
    additionalCents: 0,
    manualQuote: true,
    label: 'Manual freight quote',
  },
}

function isShippingProfile(value: unknown): value is ShippingProfile {
  return (
    value === 'shirt' ||
    value === 'unframed_print' ||
    value === 'framed_print' ||
    value === 'oversized' ||
    value === 'pickup_only' ||
    value === 'manual_quote'
  )
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function sanitizeShippingProfileRows(rows: ShippingProfileRow[]): ValidShippingProfileRow[] {
  return rows.filter((row): row is ValidShippingProfileRow => (
    isShippingProfile(row.profile_key) &&
    typeof row.label === 'string' &&
    row.label.trim().length > 0 &&
    isNonNegativeInteger(row.base_cents) &&
    isNonNegativeInteger(row.additional_cents) &&
    typeof row.manual_quote === 'boolean'
  ))
}

export async function getShippingProfileReadModel(): Promise<ShippingProfileReadModel> {
  if (!hasSupabaseConfig()) {
    return {
      source: 'default',
      rules: DEFAULT_SHIPPING_RULES,
    }
  }

  try {
    const rows = await supabaseRequest<ShippingProfileRow[]>(
      '/rest/v1/shop_shipping_profiles?select=profile_key,label,base_cents,additional_cents,manual_quote'
    )
    const rules: ShippingProfileRules = { ...DEFAULT_SHIPPING_RULES }
    let hasLiveProfile = false

    for (const row of sanitizeShippingProfileRows(rows)) {
      hasLiveProfile = true
      rules[row.profile_key] = {
        label: row.label,
        baseCents: row.base_cents,
        additionalCents: row.additional_cents,
        manualQuote: row.manual_quote,
      }
    }

    return {
      source: hasLiveProfile ? 'supabase' : 'default',
      rules,
    }
  } catch {
    return {
      source: 'default',
      rules: DEFAULT_SHIPPING_RULES,
    }
  }
}

function isAustralia(country: string) {
  const normalized = country.trim().toLowerCase()
  return normalized === 'au' || normalized === 'australia'
}

function getProfile(line: CartLine): ShippingProfile {
  return line.shippingProfile ?? 'manual_quote'
}

function getCurrency(lines: CartLine[]) {
  return lines[0]?.currency || DEFAULT_CURRENCY
}

function needsManualQuote(
  lines: CartLine[],
  destination: ShippingDestination,
  rules: ShippingProfileRules
) {
  if (!isAustralia(destination.country)) return true

  return lines.some((line) => {
    const profile = getProfile(line)
    return line.requiresManualShippingQuote || rules[profile].manualQuote
  })
}

function allPickupAvailable(lines: CartLine[]) {
  return lines.length > 0 && lines.every((line) => (
    line.pickupAvailable || getProfile(line) === 'pickup_only'
  ))
}

function calculateDeliveryCents(lines: CartLine[], rules: ShippingProfileRules) {
  let highestBase = 0
  let additional = 0
  let nonCombinableTotal = 0
  let chargeableItems = 0

  for (const line of lines) {
    const profile = getProfile(line)
    if (profile === 'pickup_only') continue

    const rule = rules[profile]
    if (rule.manualQuote) continue

    if (line.canCombineShipping === false) {
      nonCombinableTotal += line.quantity * rule.baseCents
      continue
    }

    highestBase = Math.max(highestBase, rule.baseCents)
    chargeableItems += line.quantity

    const extraUnits = Math.max(0, line.quantity - 1)
    additional += extraUnits * rule.additionalCents
  }

  if (chargeableItems > 1) {
    const mixedAdditional = Math.max(0, chargeableItems - 1) * 500
    additional = Math.max(additional, mixedAdditional)
  }

  return nonCombinableTotal + highestBase + additional
}

export function calculateShippingQuote(
  lines: CartLine[],
  destination: ShippingDestination,
  rules: ShippingProfileRules = DEFAULT_SHIPPING_RULES
): ShippingQuote {
  const currency = getCurrency(lines)

  if (lines.length === 0) {
    return {
      currency,
      options: [],
      requiresManualQuote: false,
      message: 'Add products to estimate shipping.',
    }
  }

  if (needsManualQuote(lines, destination, rules)) {
    return {
      currency,
      requiresManualQuote: true,
      options: allPickupAvailable(lines)
        ? [{
            id: 'pickup',
            kind: 'pickup',
            label: 'Pickup',
            amountCents: 0,
            currency,
            description: 'Paul will confirm pickup details.',
          }]
        : [{
            id: 'manual-quote',
            kind: 'manual_quote',
            label: 'Shipping quote required',
            amountCents: 0,
            currency,
            description: isAustralia(destination.country)
              ? 'Paul will confirm freight before payment.'
              : 'International shipping needs a manual quote.',
          }],
      message: isAustralia(destination.country)
        ? 'This cart needs a manual shipping quote.'
        : 'International shipping needs a manual quote.',
    }
  }

  const options: ShippingOption[] = [{
    id: 'au-standard',
    kind: 'delivery',
    label: 'Australia standard shipping',
    amountCents: calculateDeliveryCents(lines, rules),
    currency,
    description: destination.postcode
      ? `Estimated for postcode ${destination.postcode}.`
      : 'Estimated for Australia.',
  }]

  if (allPickupAvailable(lines)) {
    options.push({
      id: 'pickup',
      kind: 'pickup',
      label: 'Pickup',
      amountCents: 0,
      currency,
      description: 'Paul will confirm pickup details.',
    })
  }

  return {
    currency,
    options,
    requiresManualQuote: false,
  }
}

export async function calculateLiveShippingQuote(
  lines: CartLine[],
  destination: ShippingDestination
) {
  const readModel = await getShippingProfileReadModel()
  return {
    ...calculateShippingQuote(lines, destination, readModel.rules),
    profileSource: readModel.source,
  }
}
