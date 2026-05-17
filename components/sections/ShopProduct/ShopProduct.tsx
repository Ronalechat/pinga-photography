'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import ProductMediaViewer from '@/components/ui/ProductMediaViewer/ProductMediaViewer'
import PingaButton from '@/components/ui/Button/PingaButton'
import PingaToggle from '@/components/ui/ToggleButton/PingaToggle'
import Typography from '@/components/ui/Typography/Typography'
import { analytics } from '@/lib/analytics'
import { formatMoney } from '@/lib/shop/money'
import type {
  SelectedShopOption,
  ShopProductConfig,
} from '@/lib/shop/types'
import { useShopCart } from '../ShopCart/ShopCartProvider'
import styles from './ShopProduct.module.css'

export interface ShopProductProps {
  product: ShopProductConfig
}

function initialSelections(product: ShopProductConfig) {
  return Object.fromEntries(
    product.optionGroups
      .filter((group) => group.values.length > 0)
      .map((group) => [group.key, group.values[0].key])
  )
}

function getSelectedOptions(product: ShopProductConfig, selections: Record<string, string>) {
  return product.optionGroups.reduce<SelectedShopOption[]>((selected, group) => {
    const value = group.values.find((option) => option.key === selections[group.key])
    if (!value) return selected

    selected.push({
      groupKey: group.key,
      groupLabel: group.label,
      valueKey: value.key,
      valueLabel: value.label,
      priceDeltaCents: value.priceDeltaCents ?? 0,
    })

    return selected
  }, [])
}

function stockLabel(product: ShopProductConfig) {
  const stockMode = product.liveStock?.stockMode ?? product.stockMode
  const availableQuantity = product.liveStock?.availableQuantity ?? product.stockQuantity

  if (product.mode === 'sold_out' || product.liveStock?.soldOut) return 'Sold out'
  if (!product.showStock) return null
  if (stockMode === 'unlimited') return null
  if (stockMode === 'enquiry_goal') return null
  if (stockMode === 'one_of_one') return 'One of a kind'
  if (typeof availableQuantity !== 'number') return 'Limited run'

  if (availableQuantity <= 0) return 'Sold out'
  if (availableQuantity === 1) return '1 remaining'
  return `${availableQuantity} remaining`
}

function shippingLabel(product: ShopProductConfig) {
  if (product.shippingNote) return product.shippingNote
  if (product.requiresManualShippingQuote || product.shippingProfile === 'manual_quote') {
    return 'Shipping quote required'
  }
  if (product.shippingProfile === 'pickup_only') return 'Pickup only'
  if (product.pickupAvailable) return 'Pickup available'
  return 'Shipping calculated before payment'
}

function enquiryHref(product: ShopProductConfig, intent: 'enquiry' | 'quote' | 'sold_out') {
  const params = new URLSearchParams({
    product: product.productId,
    intent,
  })

  return `/enquiry?${params.toString()}`
}

export default function ShopProduct({ product }: ShopProductProps) {
  const { addLine } = useShopCart()
  const [selections, setSelections] = useState(() => initialSelections(product))
  const [quantity, setQuantity] = useState('1')
  const [added, setAdded] = useState(false)

  const selectedOptions = useMemo(() => (
    getSelectedOptions(product, selections)
  ), [product, selections])
  const unitPriceCents = product.priceCents + selectedOptions.reduce((total, option) => (
    total + option.priceDeltaCents
  ), 0)
  const quantityNumber = Math.max(1, Math.floor(Number(quantity) || 1))
  const stockMode = product.liveStock?.stockMode ?? product.stockMode
  const finiteStock = stockMode === 'limited' || stockMode === 'one_of_one'
  const availableStock = finiteStock
    ? product.liveStock?.availableQuantity ?? product.stockQuantity ?? 0
    : undefined
  const soldOut = (
    product.mode === 'sold_out' ||
    Boolean(product.liveStock?.soldOut) ||
    (finiteStock && (availableStock ?? 0) <= 0)
  )
  const actionMode = soldOut ? 'sold_out' : product.mode
  const canAddToCart = actionMode === 'cart_checkout'
  const maxQuantity = finiteStock ? Math.max(1, availableStock ?? 1) : undefined
  const displayStock = stockLabel(product)
  const displayShipping = shippingLabel(product)
  const actionHref = enquiryHref(
    product,
    actionMode === 'manual_quote'
      ? 'quote'
      : actionMode === 'sold_out'
        ? 'sold_out'
        : 'enquiry'
  )

  function handleSelection(groupKey: string, value: string | string[]) {
    if (Array.isArray(value)) return
    setSelections((current) => ({ ...current, [groupKey]: value }))
    setAdded(false)
  }

  function handleAddToCart() {
    if (!canAddToCart) return
    const clampedQuantity = maxQuantity
      ? Math.min(quantityNumber, maxQuantity)
      : quantityNumber

    addLine({
      productId: product.productId,
      title: product.title,
      image: product.images[0]?.src,
      unitPriceCents,
      currency: product.currency,
      quantity: clampedQuantity,
      selectedOptions,
      shippingProfile: product.shippingProfile,
      requiresManualShippingQuote: product.requiresManualShippingQuote,
      pickupAvailable: product.pickupAvailable,
      canCombineShipping: product.canCombineShipping,
      weightGrams: product.weightGrams,
      packageLengthMm: product.packageLengthMm,
      packageWidthMm: product.packageWidthMm,
      packageHeightMm: product.packageHeightMm,
    })
    setAdded(true)
    analytics.track('Shop Product Added To Cart', {
      productId: product.productId,
      productName: product.title,
      quantity: clampedQuantity,
    })
  }

  return (
    <section className={styles.root} aria-label={product.title}>
      <div className={styles.inner}>
        <div className={styles.media}>
          <ProductMediaViewer images={product.images} label={product.title} />
        </div>

        <div className={styles.content}>
          <div className={styles.copy}>
            {displayStock && (
              <Typography variant="eyebrow" as="p">
                {displayStock}
              </Typography>
            )}
            <Typography variant="headingMedium" as="h2" className={styles.title}>
              {product.title}
            </Typography>
            <Typography variant="bodyLarge" as="p" className={styles.price}>
              {formatMoney(unitPriceCents, product.currency)}
            </Typography>
            {product.subtitle && (
              <Typography variant="body" as="p" className={styles.subtitle}>
                {product.subtitle}
              </Typography>
            )}
            {product.description && (
              <Typography variant="body" as="p" className={styles.description}>
                {product.description}
              </Typography>
            )}
          </div>

          {product.optionGroups.length > 0 && (
            <div className={styles.options}>
              {product.optionGroups.map((group) => (
                <div key={group.key} className={styles.optionGroup}>
                  <Typography variant="label" as="p">
                    {group.label}
                  </Typography>
                  <PingaToggle
                    options={group.values.map((value) => value.label)}
                    selected={
                      group.values.find((value) => value.key === selections[group.key])?.label ??
                      group.values[0]?.label ??
                      ''
                    }
                    onChange={(value) => {
                      const selectedValue = group.values.find((option) => option.label === value)
                      if (selectedValue) handleSelection(group.key, selectedValue.key)
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className={styles.meta}>
            <Typography variant="caption" as="p">
              {displayShipping}
            </Typography>
            {product.requiresManualShippingQuote && (
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Paul will confirm freight before payment.
              </Typography>
            )}
          </div>

          {canAddToCart ? (
            <div className={styles.purchase}>
              <label className={styles.quantityLabel}>
                <Typography variant="label" as="span">
                  Quantity
                </Typography>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value)
                    setAdded(false)
                  }}
                  className={styles.quantityInput}
                />
              </label>

              <PingaButton
                variant="sweep"
                type="button"
                onClick={handleAddToCart}
              >
                {product.ctaLabel ?? 'Add to cart'}
              </PingaButton>
            </div>
          ) : (
            <div className={styles.actionPanel}>
              <div className={styles.actionCopy}>
                <Typography variant="label" as="p">
                  {actionMode === 'sold_out'
                    ? 'Sold out'
                    : actionMode === 'manual_quote'
                      ? 'Manual quote'
                      : 'Available by enquiry'}
                </Typography>
                <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                  {actionMode === 'sold_out'
                    ? 'This piece is no longer available. Ask about future editions or similar work.'
                    : actionMode === 'manual_quote'
                      ? 'Paul will confirm availability, freight, and payment details before purchase.'
                      : 'Send a note and Paul will reply with availability and next steps.'}
                </Typography>
              </div>
              <Link href={actionHref} className={styles.actionLink}>
                <Typography variant="label" as="span">
                  {actionMode === 'sold_out'
                    ? 'Ask about editions'
                    : actionMode === 'manual_quote'
                      ? product.ctaLabel ?? 'Request quote'
                      : product.ctaLabel ?? 'Send enquiry'}
                </Typography>
              </Link>
            </div>
          )}

          {added && (
            <Typography variant="caption" as="p" className={styles.added} role="status">
              Added to cart.
            </Typography>
          )}
          {actionMode === 'cart_checkout' && product.requiresManualShippingQuote && (
            <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
              This piece needs a manual shipping quote before purchase.
            </Typography>
          )}
        </div>
      </div>
    </section>
  )
}
