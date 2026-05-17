import {
  calculateShippingQuote,
  type ShippingDestination,
  type ShippingOption,
  type ShippingQuote,
} from '@/lib/shop/shipping'
import type { CartLine, SelectedShopOption, ShippingProfile } from '@/lib/shop/types'

const DEFAULT_CURRENCY = 'AUD'

export interface CheckoutValidationInput {
  lines: unknown
  destination?: {
    country?: unknown
    postcode?: unknown
  }
  shippingOptionId?: unknown
}

export interface CheckoutValidationResult {
  ok: boolean
  errors: string[]
  lines: CartLine[]
  destination: ShippingDestination
  subtotalCents: number
  currency: string
  shippingQuote: ShippingQuote
  selectedShippingOption?: ShippingOption
  totalCents?: number
}

function sanitizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : fallback
}

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return value
}

function sanitizeBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function sanitizeShippingProfile(value: unknown): ShippingProfile | undefined {
  if (
    value === 'shirt' ||
    value === 'unframed_print' ||
    value === 'framed_print' ||
    value === 'oversized' ||
    value === 'pickup_only' ||
    value === 'manual_quote'
  ) {
    return value
  }

  return undefined
}

function sanitizeSelectedOption(value: unknown): SelectedShopOption | null {
  if (!value || typeof value !== 'object') return null
  const option = value as Partial<SelectedShopOption>
  const groupKey = sanitizeString(option.groupKey)
  const groupLabel = sanitizeString(option.groupLabel)
  const valueKey = sanitizeString(option.valueKey)
  const valueLabel = sanitizeString(option.valueLabel)
  const priceDeltaCents = sanitizeNumber(option.priceDeltaCents)

  if (!groupKey || !groupLabel || !valueKey || !valueLabel) return null

  return {
    groupKey,
    groupLabel,
    valueKey,
    valueLabel,
    priceDeltaCents: priceDeltaCents ?? 0,
  }
}

export function sanitizeCartLine(value: unknown): CartLine | null {
  if (!value || typeof value !== 'object') return null
  const line = value as Partial<CartLine>
  const lineId = sanitizeString(line.lineId)
  const productId = sanitizeString(line.productId)
  const title = sanitizeString(line.title)
  const unitPriceCents = sanitizeNumber(line.unitPriceCents)
  const quantity = sanitizeNumber(line.quantity)

  if (!lineId || !productId || !title) return null
  if (unitPriceCents === undefined || !Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
    return null
  }
  if (quantity === undefined || !Number.isSafeInteger(quantity) || quantity < 1) return null

  return {
    lineId,
    productId,
    title,
    image: sanitizeString(line.image) || undefined,
    unitPriceCents,
    currency: sanitizeString(line.currency, DEFAULT_CURRENCY) || DEFAULT_CURRENCY,
    quantity,
    selectedOptions: Array.isArray(line.selectedOptions)
      ? line.selectedOptions
          .map(sanitizeSelectedOption)
          .filter((option): option is SelectedShopOption => Boolean(option))
      : [],
    shippingProfile: sanitizeShippingProfile(line.shippingProfile),
    requiresManualShippingQuote: sanitizeBoolean(line.requiresManualShippingQuote),
    pickupAvailable: sanitizeBoolean(line.pickupAvailable),
    canCombineShipping: sanitizeBoolean(line.canCombineShipping),
    weightGrams: sanitizeNumber(line.weightGrams),
    packageLengthMm: sanitizeNumber(line.packageLengthMm),
    packageWidthMm: sanitizeNumber(line.packageWidthMm),
    packageHeightMm: sanitizeNumber(line.packageHeightMm),
  }
}

export function sanitizeCartLines(lines: unknown) {
  return Array.isArray(lines)
    ? lines.map(sanitizeCartLine).filter((line): line is CartLine => Boolean(line))
    : []
}

export function sanitizeDestination(destination?: CheckoutValidationInput['destination']) {
  return {
    country: sanitizeString(destination?.country, 'AU') || 'AU',
    postcode: sanitizeString(destination?.postcode),
  }
}

function calculateSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0)
}

function validateLines(lines: CartLine[]) {
  const errors: string[] = []

  if (lines.length === 0) {
    errors.push('Cart is empty.')
  }

  const currencies = new Set(lines.map((line) => line.currency))
  if (currencies.size > 1) {
    errors.push('Cart lines must use one currency.')
  }

  const subtotalCents = calculateSubtotal(lines)
  if (!Number.isSafeInteger(subtotalCents)) {
    errors.push('Cart total is too large to process automatically.')
  }

  return errors
}

export function validateCheckoutInput(input: CheckoutValidationInput): CheckoutValidationResult {
  const lines = sanitizeCartLines(input.lines)
  const destination = sanitizeDestination(input.destination)
  const shippingOptionId = sanitizeString(input.shippingOptionId)
  const errors = validateLines(lines)
  const currency = lines[0]?.currency || DEFAULT_CURRENCY
  const subtotalCents = calculateSubtotal(lines)
  const shippingQuote = calculateShippingQuote(lines, destination)
  let selectedShippingOption: ShippingOption | undefined

  if (shippingOptionId) {
    selectedShippingOption = shippingQuote.options.find((option) => option.id === shippingOptionId)

    if (!selectedShippingOption) {
      errors.push('Selected shipping option is no longer available.')
    }
  } else if (shippingQuote.requiresManualQuote) {
    const manualOption = shippingQuote.options.find((option) => option.kind === 'manual_quote')
    if (manualOption) {
      selectedShippingOption = manualOption
    }
  }

  if (!shippingQuote.requiresManualQuote && !selectedShippingOption && lines.length > 0) {
    errors.push('Choose a shipping option before checkout.')
  }

  const totalCents = selectedShippingOption
    ? subtotalCents + selectedShippingOption.amountCents
    : undefined

  return {
    ok: errors.length === 0,
    errors,
    lines,
    destination,
    subtotalCents,
    currency,
    shippingQuote,
    selectedShippingOption,
    totalCents,
  }
}
