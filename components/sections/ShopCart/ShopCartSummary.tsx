'use client'

import { useState } from 'react'
import PingaButton from '@/components/ui/Button/PingaButton'
import Typography from '@/components/ui/Typography/Typography'
import { formatMoney } from '@/lib/shop/money'
import type { ShippingQuote } from '@/lib/shop/shipping'
import { useShopCart } from './ShopCartProvider'
import styles from './ShopCartSummary.module.css'

type QuoteStatus = 'idle' | 'loading' | 'ready' | 'error'
type CheckoutStatus = 'idle' | 'loading' | 'setup' | 'error'

interface CheckoutResponse {
  error?: string
  setupRequired?: boolean
  url?: string
  errors?: string[]
}

function quoteSignature(
  lines: ReturnType<typeof useShopCart>['lines'],
  country: string,
  postcode: string
) {
  return JSON.stringify({
    country,
    postcode,
    lines: lines.map((line) => ({
      lineId: line.lineId,
      quantity: line.quantity,
      shippingProfile: line.shippingProfile,
      requiresManualShippingQuote: line.requiresManualShippingQuote,
      pickupAvailable: line.pickupAvailable,
      canCombineShipping: line.canCombineShipping,
    })),
  })
}

export default function ShopCartSummary() {
  const {
    lines,
    itemCount,
    subtotalCents,
    updateQuantity,
    removeLine,
  } = useShopCart()
  const [open, setOpen] = useState(false)
  const [country, setCountry] = useState('AU')
  const [postcode, setPostcode] = useState('')
  const [quote, setQuote] = useState<ShippingQuote | null>(null)
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle')
  const [quotedSignature, setQuotedSignature] = useState('')
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState('')
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const currency = lines[0]?.currency ?? 'AUD'
  const currentQuoteSignature = quoteSignature(lines, country, postcode)
  const quoteIsStale = quoteStatus === 'ready' && quotedSignature !== currentQuoteSignature
  const selectedShippingOption = quote?.options.find((option) => (
    option.id === selectedShippingOptionId
  ))
  const checkoutTotalCents = selectedShippingOption
    ? subtotalCents + selectedShippingOption.amountCents
    : undefined
  const checkoutIsDisabled = (
    quoteStatus !== 'ready' ||
    quoteIsStale ||
    checkoutStatus === 'loading' ||
    !selectedShippingOption ||
    selectedShippingOption.kind === 'manual_quote'
  )

  function resetQuote() {
    setQuote(null)
    setQuoteStatus('idle')
    setSelectedShippingOptionId('')
    setCheckoutStatus('idle')
    setCheckoutMessage('')
  }

  function resetCheckoutMessage() {
    setCheckoutStatus('idle')
    setCheckoutMessage('')
  }

  function getCheckoutMessage(data: unknown, fallback: string) {
    if (!data || typeof data !== 'object') return fallback

    const response = data as CheckoutResponse
    if (Array.isArray(response.errors) && response.errors.length > 0) {
      return response.errors.join(' ')
    }

    return response.error || fallback
  }

  async function handleEstimateShipping() {
    setQuoteStatus('loading')
    resetCheckoutMessage()

    try {
      const res = await fetch('/api/shop/shipping-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines,
          destination: { country, postcode },
        }),
      })

      if (!res.ok) {
        setQuoteStatus('error')
        return
      }

      const data = await res.json() as ShippingQuote
      setQuote(data)
      setQuotedSignature(currentQuoteSignature)
      setSelectedShippingOptionId(data.options[0]?.id ?? '')
      setQuoteStatus('ready')
    } catch {
      setQuoteStatus('error')
    }
  }

  async function handleCheckout() {
    if (checkoutIsDisabled) return

    setCheckoutStatus('loading')
    setCheckoutMessage('')

    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines,
          destination: { country, postcode },
          shippingOptionId: selectedShippingOptionId,
        }),
      })
      const data = await res.json().catch(() => null) as unknown

      if (res.ok && data && typeof data === 'object' && 'url' in data) {
        const url = (data as CheckoutResponse).url
        if (url) {
          window.location.href = url
          return
        }
      }

      const message = getCheckoutMessage(data, 'Checkout could not be started.')
      setCheckoutStatus(
        data && typeof data === 'object' && (data as CheckoutResponse).setupRequired
          ? 'setup'
          : 'error'
      )
      setCheckoutMessage(message)
    } catch {
      setCheckoutStatus('error')
      setCheckoutMessage('Checkout could not be started. Please try again.')
    }
  }

  return (
    <section className={styles.root} aria-label="Shop cart">
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className={styles.toggleLabel}>
          <span className={styles.cartIcon} aria-hidden="true" />
          <Typography variant="eyebrow" as="span">
            Cart
          </Typography>
          {itemCount > 0 && (
            <Typography variant="caption" as="span" className={styles.count} aria-live="polite">
              {itemCount}
            </Typography>
          )}
        </span>
      </button>

      {open && (
        <div className={styles.panel}>
          {lines.length === 0 ? (
            <Typography variant="body" as="p" color="var(--color-text-muted-high)">
              Your cart is empty.
            </Typography>
          ) : (
            <>
              <div className={styles.lines}>
                {lines.map((line) => (
                  <div key={line.lineId} className={styles.line}>
                    <div className={styles.lineCopy}>
                      <Typography variant="body" as="p" className={styles.lineTitle}>
                        {line.title}
                      </Typography>
                      {line.selectedOptions.length > 0 && (
                        <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                          {line.selectedOptions.map((option) => option.valueLabel).join(' / ')}
                        </Typography>
                      )}
                      <Typography variant="caption" as="p" color="var(--color-text-muted-low)">
                        {formatMoney(line.unitPriceCents, line.currency)}
                      </Typography>
                    </div>

                    <div className={styles.lineControls}>
                      <label className={styles.quantityLabel}>
                        <Typography variant="caption" as="span">
                          Qty
                        </Typography>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateQuantity(line.lineId, Number(e.target.value))}
                          className={styles.quantityInput}
                          aria-label={`Quantity for ${line.title}`}
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => removeLine(line.lineId)}
                      >
                        <Typography variant="caption" as="span">
                          Remove
                        </Typography>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.total}>
                <Typography variant="eyebrow" as="p">
                  Subtotal
                </Typography>
                <Typography variant="bodyLarge" as="p">
                  {formatMoney(subtotalCents, currency)}
                </Typography>
              </div>

              <div className={styles.delivery}>
                <div className={styles.deliveryHeader}>
                  <Typography variant="eyebrow" as="p">
                    Delivery
                  </Typography>
                  <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                    Estimate before payment
                  </Typography>
                </div>

                <div className={styles.deliveryFields}>
                  <label className={styles.deliveryField}>
                    <Typography variant="caption" as="span">
                      Country
                    </Typography>
                    <select
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value)
                        resetQuote()
                      }}
                      className={styles.deliveryInput}
                    >
                      <option value="AU">Australia</option>
                      <option value="international">International</option>
                    </select>
                  </label>

                  <label className={styles.deliveryField}>
                    <Typography variant="caption" as="span">
                      Postcode
                    </Typography>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={postcode}
                      onChange={(e) => {
                        setPostcode(e.target.value.replace(/[^\dA-Za-z\s-]/g, ''))
                        resetQuote()
                      }}
                      className={styles.deliveryInput}
                      placeholder="2000"
                    />
                  </label>
                </div>

                <PingaButton
                  variant="ghost"
                  type="button"
                  disabled={quoteStatus === 'loading'}
                  onClick={handleEstimateShipping}
                >
                  {quoteStatus === 'loading' ? 'Estimating...' : 'Estimate shipping'}
                </PingaButton>

                {quoteStatus === 'error' && (
                  <Typography variant="caption" as="p" className={styles.error} role="alert">
                    Shipping could not be estimated. Please try again.
                  </Typography>
                )}

                {quoteIsStale && (
                  <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                    Cart changed. Estimate shipping again before checkout.
                  </Typography>
                )}

                {quoteStatus === 'ready' && quote && !quoteIsStale && (
                  <div className={styles.shippingOptions}>
                    {quote.message && (
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {quote.message}
                      </Typography>
                    )}
                    {quote.options.map((option) => (
                      <label key={option.id} className={styles.shippingOption}>
                        <input
                          type="radio"
                          name="shop-shipping-option"
                          value={option.id}
                          checked={selectedShippingOptionId === option.id}
                          onChange={() => {
                            setSelectedShippingOptionId(option.id)
                            resetCheckoutMessage()
                          }}
                          className={styles.shippingRadio}
                        />
                        <span className={styles.shippingCopy}>
                          <Typography variant="body" as="p">
                            {option.label}
                          </Typography>
                          {option.description && (
                            <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                              {option.description}
                            </Typography>
                          )}
                        </span>
                        <Typography variant="body" as="p">
                          {option.kind === 'manual_quote'
                            ? 'Quote'
                            : formatMoney(option.amountCents, option.currency)}
                        </Typography>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedShippingOption && !quoteIsStale && (
                <div className={styles.checkoutTotals}>
                  <div className={styles.checkoutRow}>
                    <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                      Shipping
                    </Typography>
                    <Typography variant="body" as="p">
                      {selectedShippingOption.kind === 'manual_quote'
                        ? 'Quote'
                        : formatMoney(selectedShippingOption.amountCents, currency)}
                    </Typography>
                  </div>
                  {checkoutTotalCents !== undefined && (
                    <div className={styles.checkoutRow}>
                      <Typography variant="eyebrow" as="p">
                        Total
                      </Typography>
                      <Typography variant="bodyLarge" as="p">
                        {formatMoney(checkoutTotalCents, currency)}
                      </Typography>
                    </div>
                  )}
                </div>
              )}

              <PingaButton
                variant="sweep"
                type="button"
                disabled={checkoutIsDisabled}
                onClick={handleCheckout}
              >
                {checkoutStatus === 'loading' ? 'Preparing checkout...' : 'Continue to checkout'}
              </PingaButton>

              {selectedShippingOption?.kind === 'manual_quote' && !quoteIsStale && (
                <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                  This cart needs Paul to confirm freight before payment.
                </Typography>
              )}

              {checkoutMessage && (
                <Typography
                  variant="caption"
                  as="p"
                  className={checkoutStatus === 'setup' ? styles.notice : styles.error}
                  role="status"
                >
                  {checkoutMessage}
                </Typography>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
