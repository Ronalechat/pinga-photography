'use client'

import { useRef, useState } from 'react'
import Typography from '@/components/ui/Typography/Typography'
import PingaButton from '@/components/ui/Button/PingaButton'
import { analytics } from '@/lib/analytics'
import utilStyles from '@/styles/utility.module.css'
import styles from './ProductEnquiry.module.css'

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'X-Large'] as const

type ShirtSize = typeof SIZE_OPTIONS[number]
type Status = 'idle' | 'sending' | 'sent' | 'error'
type FieldErrors = { name?: string; email?: string; phone?: string; quantity?: string }

export interface ProductImage {
  src: string
  alt?: string
}

export interface ProductEnquiryProps {
  productName: string
  subtitle?: string
  images?: ProductImage[]
  minimumOrderGoal?: number
  ctaLabel?: string
  initialStatus?: Status
}

export default function ProductEnquiry({
  productName,
  subtitle = 'Register your interest for the next print run.',
  images = [],
  minimumOrderGoal = 20,
  ctaLabel = 'Send enquiry',
  initialStatus = 'idle',
}: ProductEnquiryProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [size, setSize] = useState<ShirtSize>('Medium')
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState<Status>(initialStatus)
  const [errors, setErrors] = useState<FieldErrors>({})
  const touchStartXRef = useRef<number | null>(null)
  const swipeHandledRef = useRef(false)
  const selectedImage = images[activeImage]
  const hasMultipleImages = images.length > 1

  function showImage(direction: 'previous' | 'next') {
    if (!hasMultipleImages) return
    setActiveImage((current) => (
      direction === 'next'
        ? (current + 1) % images.length
        : (current - 1 + images.length) % images.length
    ))
  }

  function handleImageNavClick(direction: 'previous' | 'next') {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false
      return
    }

    showImage(direction)
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = e.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current
    touchStartXRef.current = null
    if (startX === null) return

    const endX = e.changedTouches[0]?.clientX
    if (endX === undefined) return

    const deltaX = endX - startX
    if (Math.abs(deltaX) < 40) return

    swipeHandledRef.current = true
    showImage(deltaX > 0 ? 'next' : 'previous')
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const qty = Number(quantity)

    if (!name.trim()) next.name = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Please enter a valid email address.'
    }
    if (phone.trim() && !/^[\d\s+\-(). ]+$/.test(phone)) {
      next.phone = 'Phone may only contain digits, spaces, and + - ( ).'
    }
    if (!Number.isInteger(qty) || qty < 1) {
      next.quantity = 'Quantity must be at least 1.'
    }

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      analytics.track('Shop Enquiry Submit Failed', { reason: 'validation', productName })
      return
    }

    setErrors({})
    setStatus('sending')

    try {
      const res = await fetch('/api/shop-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          name,
          email,
          phone,
          size,
          quantity: Number(quantity),
        }),
      })

      if (res.ok) {
        analytics.track('Shop Enquiry Submitted', { productName, size })
        setStatus('sent')
      } else {
        analytics.track('Shop Enquiry Submit Failed', { reason: 'server', productName })
        setStatus('error')
      }
    } catch {
      analytics.track('Shop Enquiry Submit Failed', { reason: 'server', productName })
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <section className={styles.root} aria-label="Shop enquiry sent">
        <div className={styles.sent}>
          <Typography variant="displayThin" as="p" className={styles.sentTitle}>
            Thanks{ name.trim() ? `, ${name.trim().split(' ')[0]}` : '' }.
          </Typography>
          <Typography variant="body" as="p" color="var(--color-text-muted-high)">
            Paul will be in touch when the shirt run is ready.
          </Typography>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.root} aria-label={`${productName} enquiry`}>
      <div className={styles.inner}>
        <div className={styles.media}>
          <div
            className={styles.imageFrame}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {selectedImage?.src ? (
              <img
                src={selectedImage.src}
                alt={selectedImage.alt || productName}
                className={utilStyles.imgBlock}
                loading="eager"
                decoding="async"
                draggable={false}
              />
            ) : (
              <div className={styles.placeholder}>
                <Typography variant="eyebrow">{productName}</Typography>
              </div>
            )}

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  className={`${styles.imageNav} ${styles.imageNavPrevious}`}
                  onClick={() => handleImageNavClick('previous')}
                  aria-label="Show previous product image"
                />
                <button
                  type="button"
                  className={`${styles.imageNav} ${styles.imageNavNext}`}
                  onClick={() => handleImageNavClick('next')}
                  aria-label="Show next product image"
                />
              </>
            )}
          </div>

          {hasMultipleImages && (
            <div className={styles.thumbnails} aria-label="Product images">
              {images.map((image, index) => (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  className={[
                    styles.thumbnail,
                    index === activeImage ? styles.thumbnailActive : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={index === activeImage}
                >
                  <img
                    src={image.src}
                    alt=""
                    className={utilStyles.imgBlock}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.copy}>
            <Typography variant="eyebrow" as="p">
              Minimum run: {minimumOrderGoal} enquiries
            </Typography>
            <Typography variant="headingMedium" as="h2" className={styles.title}>
              {productName}
            </Typography>
            <Typography variant="body" as="p" className={styles.subtitle}>
              {subtitle}
            </Typography>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="pe-name" className={styles.label}>
                <Typography variant="label">Name</Typography>
              </label>
              <input
                id="pe-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                }}
                className={[styles.input, errors.name ? styles.inputError : ''].filter(Boolean).join(' ')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'pe-name-error' : undefined}
              />
              {errors.name && (
                <Typography variant="caption" as="p" id="pe-name-error" className={styles.fieldError}>
                  {errors.name}
                </Typography>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="pe-email" className={styles.label}>
                <Typography variant="label">Email</Typography>
              </label>
              <input
                id="pe-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
                }}
                className={[styles.input, errors.email ? styles.inputError : ''].filter(Boolean).join(' ')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'pe-email-error' : undefined}
              />
              {errors.email && (
                <Typography variant="caption" as="p" id="pe-email-error" className={styles.fieldError}>
                  {errors.email}
                </Typography>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="pe-phone" className={styles.label}>
                <Typography variant="label">Phone</Typography>
              </label>
              <input
                id="pe-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^\d\s+\-(). ]/g, '')
                  setPhone(filtered)
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }))
                }}
                className={[styles.input, errors.phone ? styles.inputError : ''].filter(Boolean).join(' ')}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'pe-phone-error' : undefined}
              />
              {errors.phone && (
                <Typography variant="caption" as="p" id="pe-phone-error" className={styles.fieldError}>
                  {errors.phone}
                </Typography>
              )}
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="pe-size" className={styles.label}>
                  <Typography variant="label">Size</Typography>
                </label>
                <select
                  id="pe-size"
                  name="size"
                  value={size}
                  onChange={(e) => setSize(e.target.value as ShirtSize)}
                  className={styles.input}
                >
                  {SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="pe-quantity" className={styles.label}>
                  <Typography variant="label">Quantity</Typography>
                </label>
                <input
                  id="pe-quantity"
                  name="quantity"
                  type="number"
                  required
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value)
                    if (errors.quantity) setErrors(prev => ({ ...prev, quantity: undefined }))
                  }}
                  className={[styles.input, errors.quantity ? styles.inputError : ''].filter(Boolean).join(' ')}
                  aria-invalid={!!errors.quantity}
                  aria-describedby={errors.quantity ? 'pe-quantity-error' : undefined}
                />
                {errors.quantity && (
                  <Typography variant="caption" as="p" id="pe-quantity-error" className={styles.fieldError}>
                    {errors.quantity}
                  </Typography>
                )}
              </div>
            </div>

            {status === 'error' && (
              <Typography variant="caption" as="p" className={styles.formError} role="alert">
                Something went wrong. Please try again.
              </Typography>
            )}

            <div className={styles.submitRow}>
              <PingaButton
                variant="sweep"
                type="submit"
                disabled={status === 'sending'}
                className={styles.submitButton}
              >
                {status === 'sending' ? 'Sending...' : ctaLabel}
              </PingaButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
