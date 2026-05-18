import type { SbBlokData } from '@storyblok/react/rsc'
import type {
  ShopStockAvailability,
  ShopOptionGroup,
  ShopProductConfig,
  ShopProductMode,
  ShippingProfile,
  StockMode,
} from '@/lib/shop/types'
import { hasSupabaseConfig, supabaseRequest } from '@/lib/shop/supabaseRest'

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

interface ShopProductBlokWithAliases extends ShopProductBlokShape {
  option_group?: ShopOptionGroupBlok[]
  option_groups?: ShopOptionGroupBlok[]
  options_groups?: ShopOptionGroupBlok[]
  options?: ShopOptionGroupBlok[]
  optionGroups?: ShopOptionGroupBlok[]
  shop_option_group?: ShopOptionGroupBlok[]
  shop_option_groups?: ShopOptionGroupBlok[]
  shop_options_group?: ShopOptionGroupBlok[]
  shop_options_groups?: ShopOptionGroupBlok[]
}

interface ShopOptionGroupBlokWithAliases extends ShopOptionGroupBlok {
  value?: ShopOptionValueBlok[]
  values?: ShopOptionValueBlok[]
  option_value?: ShopOptionValueBlok[]
  option_values?: ShopOptionValueBlok[]
  optionValues?: ShopOptionValueBlok[]
  options?: ShopOptionValueBlok[]
  shop_option_value?: ShopOptionValueBlok[]
  shop_option_values?: ShopOptionValueBlok[]
  shop_options_value?: ShopOptionValueBlok[]
  shop_options_values?: ShopOptionValueBlok[]
}

interface SupabaseInventoryRow {
  product_id: string
  stock_mode: StockMode
  stock_quantity: number | null
  sold_quantity: number
}

interface SupabaseReservationRow {
  product_id: string
  quantity: number
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

function isStockMode(value: unknown): value is StockMode {
  return (
    value === 'unlimited' ||
    value === 'limited' ||
    value === 'one_of_one' ||
    value === 'enquiry_goal'
  )
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

function getBlokList<T>(...values: Array<T[] | undefined>) {
  return values.find((value) => Array.isArray(value)) ?? []
}

function mapOptionGroups(groups: ShopOptionGroupBlok[] | undefined): ShopOptionGroup[] {
  return (groups ?? [])
    .filter((group) => Boolean(group.key && group.label))
    .map((group) => {
      const groupWithAliases = group as ShopOptionGroupBlokWithAliases

      return {
        key: group.key as string,
        label: group.label as string,
        values: getBlokList(
          group.values,
          groupWithAliases.value,
          groupWithAliases.option_value,
          groupWithAliases.option_values,
          groupWithAliases.optionValues,
          groupWithAliases.options,
          groupWithAliases.shop_option_value,
          groupWithAliases.shop_option_values,
          groupWithAliases.shop_options_value,
          groupWithAliases.shop_options_values
        )
          .filter((value) => Boolean(value.key && value.label))
          .map((value) => ({
            key: value.key as string,
            label: value.label as string,
            priceDeltaCents: toNumber(value.price_delta_cents, 0),
          })),
      }
    })
    .filter((group) => group.values.length > 0)
}

export function mapShopProductBlok(blok: ShopProductBlokShape): ShopProductConfig {
  const blokWithAliases = blok as ShopProductBlokWithAliases

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
    optionGroups: mapOptionGroups(
      getBlokList(
        blok.option_groups,
        blokWithAliases.option_group,
        blokWithAliases.options_groups,
        blokWithAliases.shop_option_group,
        blokWithAliases.shop_option_groups,
        blokWithAliases.shop_options_group,
        blokWithAliases.shop_options_groups,
        blokWithAliases.options,
        blokWithAliases.optionGroups
      )
    ),
    ctaLabel: blok.cta_label || undefined,
  }
}

function isFiniteStockMode(stockMode: StockMode) {
  return stockMode === 'limited' || stockMode === 'one_of_one'
}

function calculateAvailableQuantity(
  stockMode: StockMode,
  stockQuantity: number | undefined,
  soldQuantity: number,
  reservedQuantity: number
) {
  if (!isFiniteStockMode(stockMode)) return undefined
  return Math.max(0, (stockQuantity ?? 0) - soldQuantity - reservedQuantity)
}

function createStockAvailability(
  productId: string,
  stockMode: StockMode,
  stockQuantity: number | undefined,
  soldQuantity: number,
  reservedQuantity: number,
  source: ShopStockAvailability['source']
): ShopStockAvailability {
  const availableQuantity = calculateAvailableQuantity(
    stockMode,
    stockQuantity,
    soldQuantity,
    reservedQuantity
  )

  return {
    productId,
    source,
    stockMode,
    stockQuantity,
    soldQuantity,
    reservedQuantity,
    availableQuantity,
    soldOut: availableQuantity !== undefined && availableQuantity <= 0,
  }
}

function escapePostgrestListValue(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function productIdFilter(productIds: string[]) {
  return encodeURIComponent(`in.(${productIds.map(escapePostgrestListValue).join(',')})`)
}

function storyblokStockAvailability(product: ShopProductConfig): ShopStockAvailability {
  return createStockAvailability(
    product.productId,
    product.stockMode,
    product.stockQuantity,
    0,
    0,
    'storyblok'
  )
}

function sanitizeInventoryRows(rows: SupabaseInventoryRow[]) {
  return rows.filter((row) => (
    typeof row.product_id === 'string' &&
    isStockMode(row.stock_mode) &&
    (row.stock_quantity === null || Number.isSafeInteger(row.stock_quantity)) &&
    Number.isSafeInteger(row.sold_quantity)
  ))
}

function sanitizeReservationRows(rows: SupabaseReservationRow[]) {
  return rows.filter((row) => (
    typeof row.product_id === 'string' &&
    Number.isSafeInteger(row.quantity) &&
    row.quantity > 0
  ))
}

export function getStoryblokStockAvailability(product: ShopProductConfig) {
  return storyblokStockAvailability(product)
}

export function applyStockAvailability(
  product: ShopProductConfig,
  availability: ShopStockAvailability
): ShopProductConfig {
  return {
    ...product,
    liveStock: availability,
  }
}

export async function getLiveStockAvailability(products: ShopProductConfig[]) {
  const fallback = new Map(
    products.map((product) => [product.productId, storyblokStockAvailability(product)])
  )
  const productIds = Array.from(new Set(products.map((product) => product.productId)))

  if (productIds.length === 0 || !hasSupabaseConfig()) return fallback

  try {
    const filter = productIdFilter(productIds)
    const now = encodeURIComponent(new Date().toISOString())
    const [inventoryRows, reservationRows] = await Promise.all([
      supabaseRequest<SupabaseInventoryRow[]>(
        `/rest/v1/shop_inventory?select=product_id,stock_mode,stock_quantity,sold_quantity&product_id=${filter}`
      ),
      supabaseRequest<SupabaseReservationRow[]>(
        `/rest/v1/shop_reservations?select=product_id,quantity&product_id=${filter}&status=eq.active&expires_at=gt.${now}`
      ),
    ])
    const reservedByProduct = new Map<string, number>()

    for (const row of sanitizeReservationRows(reservationRows)) {
      reservedByProduct.set(
        row.product_id,
        (reservedByProduct.get(row.product_id) ?? 0) + row.quantity
      )
    }

    const availability = new Map(fallback)

    for (const row of sanitizeInventoryRows(inventoryRows)) {
      availability.set(
        row.product_id,
        createStockAvailability(
          row.product_id,
          row.stock_mode,
          row.stock_quantity ?? undefined,
          Math.max(0, row.sold_quantity),
          reservedByProduct.get(row.product_id) ?? 0,
          'supabase'
        )
      )
    }

    return availability
  } catch {
    return fallback
  }
}

export async function applyLiveStockAvailability(products: ShopProductConfig[]) {
  const availability = await getLiveStockAvailability(products)

  return products.map((product) => (
    applyStockAvailability(
      product,
      availability.get(product.productId) ?? storyblokStockAvailability(product)
    )
  ))
}
