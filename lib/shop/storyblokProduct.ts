import type { SbBlokData } from '@storyblok/react/rsc'
import type {
  ShopOptionDisplay,
  ShopOptionGroup,
  ShopProductConfig,
  ShopProductMode,
  ShippingProfile,
  StockMode,
} from '@/lib/shop/types'

interface SbAsset {
  filename: string
  alt?: string
}

interface ShopOptionValueBlok extends SbBlokData {
  key?: string
  label?: string
  price_delta_cents?: number | string
}

interface ShopOptionGroupBlok extends SbBlokData {
  key?: string
  label?: string
  display?: ShopOptionDisplay
  required?: boolean
  values?: ShopOptionValueBlok[]
}

export interface ShopProductBlokShape extends SbBlokData {
  product_id?: string
  title?: string
  subtitle?: string
  description?: string
  images?: SbAsset[]
  mode?: ShopProductMode
  price_cents?: number | string
  currency?: string
  stock_mode?: StockMode
  stock_quantity?: number | string
  show_stock?: boolean
  low_stock_threshold?: number | string
  shipping_profile?: ShippingProfile
  shipping_note?: string
  weight_grams?: number | string
  package_length_mm?: number | string
  package_width_mm?: number | string
  package_height_mm?: number | string
  can_combine_shipping?: boolean
  requires_manual_shipping_quote?: boolean
  pickup_available?: boolean
  option_groups?: ShopOptionGroupBlok[]
  cta_label?: string
}

function toNumber(value: number | string | undefined, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toMode(value: ShopProductMode | undefined): ShopProductMode {
  if (
    value === 'enquiry' ||
    value === 'cart_checkout' ||
    value === 'manual_quote' ||
    value === 'sold_out'
  ) {
    return value
  }

  return 'cart_checkout'
}

function toStockMode(value: StockMode | undefined): StockMode {
  if (
    value === 'unlimited' ||
    value === 'limited' ||
    value === 'one_of_one' ||
    value === 'enquiry_goal'
  ) {
    return value
  }

  return 'unlimited'
}

function toShippingProfile(value: ShippingProfile | undefined): ShippingProfile | undefined {
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

function toOptionDisplay(value: ShopOptionDisplay | undefined): ShopOptionDisplay {
  return value === 'select' ? 'select' : 'toggle'
}

function mapOptionGroups(groups: ShopOptionGroupBlok[] | undefined): ShopOptionGroup[] {
  return (groups ?? [])
    .filter((group) => Boolean(group.key && group.label))
    .map((group) => ({
      key: group.key as string,
      label: group.label as string,
      display: toOptionDisplay(group.display),
      required: group.required,
      values: (group.values ?? [])
        .filter((value) => Boolean(value.key && value.label))
        .map((value) => ({
          key: value.key as string,
          label: value.label as string,
          priceDeltaCents: toNumber(value.price_delta_cents, 0),
        })),
    }))
    .filter((group) => group.values.length > 0)
}

export function mapShopProductBlok(blok: ShopProductBlokShape): ShopProductConfig {
  return {
    productId: blok.product_id || blok._uid || 'shop-product',
    title: blok.title || 'Untitled product',
    subtitle: blok.subtitle || undefined,
    description: blok.description || undefined,
    images: (blok.images ?? [])
      .filter((image) => Boolean(image.filename))
      .map((image) => ({
        src: image.filename,
        alt: image.alt,
      })),
    mode: toMode(blok.mode),
    priceCents: toNumber(blok.price_cents, 0),
    currency: blok.currency || 'AUD',
    stockMode: toStockMode(blok.stock_mode),
    stockQuantity: blok.stock_quantity === '' ? undefined : toNumber(blok.stock_quantity, 0),
    showStock: blok.show_stock,
    lowStockThreshold: blok.low_stock_threshold === ''
      ? undefined
      : toNumber(blok.low_stock_threshold, 0),
    shippingProfile: toShippingProfile(blok.shipping_profile),
    shippingNote: blok.shipping_note || undefined,
    weightGrams: blok.weight_grams === '' ? undefined : toNumber(blok.weight_grams, 0),
    packageLengthMm: blok.package_length_mm === ''
      ? undefined
      : toNumber(blok.package_length_mm, 0),
    packageWidthMm: blok.package_width_mm === ''
      ? undefined
      : toNumber(blok.package_width_mm, 0),
    packageHeightMm: blok.package_height_mm === ''
      ? undefined
      : toNumber(blok.package_height_mm, 0),
    canCombineShipping: blok.can_combine_shipping,
    requiresManualShippingQuote: blok.requires_manual_shipping_quote,
    pickupAvailable: blok.pickup_available,
    optionGroups: mapOptionGroups(blok.option_groups),
    ctaLabel: blok.cta_label || undefined,
  }
}
