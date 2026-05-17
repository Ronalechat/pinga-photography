import type { CartLine, ShippingProfile } from '@/lib/shop/types'

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
}

interface ShippingRule {
  baseCents: number
  additionalCents: number
  manualQuote?: boolean
  label: string
}

const DEFAULT_CURRENCY = 'AUD'

const SHIPPING_RULES: Record<ShippingProfile, ShippingRule> = {
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

function needsManualQuote(lines: CartLine[], destination: ShippingDestination) {
  if (!isAustralia(destination.country)) return true

  return lines.some((line) => {
    const profile = getProfile(line)
    return line.requiresManualShippingQuote || SHIPPING_RULES[profile].manualQuote
  })
}

function allPickupAvailable(lines: CartLine[]) {
  return lines.length > 0 && lines.every((line) => (
    line.pickupAvailable || getProfile(line) === 'pickup_only'
  ))
}

function calculateDeliveryCents(lines: CartLine[]) {
  let highestBase = 0
  let additional = 0
  let nonCombinableTotal = 0
  let chargeableItems = 0

  for (const line of lines) {
    const profile = getProfile(line)
    if (profile === 'pickup_only') continue

    const rule = SHIPPING_RULES[profile]
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
  destination: ShippingDestination
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

  if (needsManualQuote(lines, destination)) {
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
    amountCents: calculateDeliveryCents(lines),
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
