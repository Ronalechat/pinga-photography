/**
 * EnquiryForm
 * ─────────────────────────────────────────────────────────────────────────────
 * Contact section for the landing page. Renders at id="enquire" — the target
 * of the Enquire scroll-intercept in SiteHeader and SiteFooter.
 *
 * FORM SUBMISSION
 * POSTs JSON to /api/enquiry, which sends a formatted email via Resend.
 * Requires RESEND_API_KEY, SENDER_EMAIL, and RECIPIENT_EMAIL env vars.
 *
 * COMPONENTS USED
 *   PingaToggle multiSelect — occasion picker (multi select, see docs)
 *   PingaButton sweep submit — primary submit action
 *
 * TRIANGLE
 * The decorative CSS triangle beside the submit button is hand-coded here via
 * the .triangle span. It is component-specific and must not be added to
 * PingaButton — see docs/ui-components.md.
 *
 * OCCASIONS
 * The options list lives in OCCASION_OPTIONS below. Update it here if the
 * set of services changes; no other file needs to change.
 */

'use client'

import { useState } from 'react'
import PingaButton from '@/components/ui/Button/PingaButton'
import PingaToggle from '@/components/ui/ToggleButton/PingaToggle'
import styles from './EnquiryForm.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const OCCASION_OPTIONS = [
  'Street',
  'Engagement',
  'Pregnancy',
  'Birthday',
  'Exhibition',
  'Portrait',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'sending' | 'sent' | 'error'
type FieldErrors = { email?: string; phone?: string; date?: string }

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EnquiryFormProps {
  /** Seed the initial status — used in Storybook stories only. */
  initialStatus?:   Status
  /** Start with all fields revealed — used on the standalone /enquiry page. */
  initialRevealed?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EnquiryForm({
  initialStatus   = 'idle',
  initialRevealed = false,
}: EnquiryFormProps) {
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [date,      setDate]      = useState('')
  const [firstName, setFirstName] = useState('')
  const [revealed,  setRevealed]  = useState(initialRevealed)
  const [occasions, setOccasions] = useState<string[]>([])
  const [message,   setMessage]   = useState('')
  const [status,    setStatus]    = useState<Status>(initialStatus)
  const [errors,    setErrors]    = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Please enter a valid email address.'
    }
    if (!phone.trim()) {
      e.phone = 'Please include a phone number.'
    } else if (!/^[\d\s+\-(). ]+$/.test(phone)) {
      e.phone = 'Phone may only contain digits, spaces, and + - ( ).'
    }
    if (!date.trim()) {
      e.date = 'Please let us know when you\'re thinking.'
    }
    return e
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStatus('sending')

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, occasions: occasions.join(', '), date, message }),
      })

      setFirstName(name.split(' ')[0])
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  // ── Sent confirmation ──────────────────────────────────────────────────────

  if (status === 'sent') {
    return (
      <section id="enquire" className={styles.root} aria-label="Enquiry sent">
        <div className={styles.sent}>
          <p className={styles.sentName}>
            Thanks{firstName ? `, ${firstName}` : ''}.
          </p>
          <p className={styles.sentCopy}>P!nga will be in touch shortly.</p>
        </div>
      </section>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <section id="enquire" className={styles.root} aria-label="Enquiry form">
      <div className={styles.inner}>

        {/* ── Left: intro ── */}
        <div className={styles.intro}>
          <h2 className={styles.heading}>
            Let&apos;s work<br />together
          </h2>
          <p className={styles.sub}>
            Tell me about the moment you want captured. P!nga will get back to you shortly.
          </p>
        </div>

        {/* ── Right: form ── */}
        <form
          onSubmit={handleSubmit}
          className={styles.form}
          noValidate
        >
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="ef-name" className={styles.fieldLabel}>Name</label>
            <input
              id="ef-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="ef-email" className={styles.fieldLabel}>Email</label>
            <input
              id="ef-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (!revealed && e.target.value.includes('@')) setRevealed(true)
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
              }}
              className={[styles.input, errors.email ? styles.inputError : ''].filter(Boolean).join(' ')}
              placeholder="your@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'ef-email-error' : undefined}
            />
            {errors.email && <p id="ef-email-error" className={styles.fieldError} role="alert">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label htmlFor="ef-phone" className={styles.fieldLabel}>Phone</label>
            <input
              id="ef-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^\d\s+\-(). ]/g, '')
                setPhone(filtered)
                if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }))
              }}
              className={[styles.input, errors.phone ? styles.inputError : ''].filter(Boolean).join(' ')}
              placeholder="+61 400 000 000"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'ef-phone-error' : undefined}
            />
            {errors.phone && <p id="ef-phone-error" className={styles.fieldError} role="alert">{errors.phone}</p>}
          </div>

          {/* Progressive reveal: Occasion + Date + Message */}
          <div className={revealed ? `${styles.progressive} ${styles.revealed}` : styles.progressive}>

            {/* Occasion — multi-select toggle */}
            <div className={styles.field}>
              <span className={styles.fieldLabel} id="ef-occasion-label">Occasion</span>
              <div role="group" aria-labelledby="ef-occasion-label">
                <PingaToggle
                  options={OCCASION_OPTIONS}
                  selected={occasions}
                  onChange={(v) => setOccasions(v as string[])}
                  multiSelect
                  variant="primary"
                />
              </div>
            </div>

            {/* Date */}
            <div className={styles.field}>
              <label htmlFor="ef-date" className={styles.fieldLabel}>When are you thinking?</label>
              <input
                id="ef-date"
                name="date"
                type="text"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  if (errors.date) setErrors(prev => ({ ...prev, date: undefined }))
                }}
                className={[styles.input, errors.date ? styles.inputError : ''].filter(Boolean).join(' ')}
                placeholder="e.g. March 2025, or flexible"
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'ef-date-error' : undefined}
              />
              {errors.date && <p id="ef-date-error" className={styles.fieldError} role="alert">{errors.date}</p>}
            </div>

            {/* Tell me more */}
            <div className={styles.field}>
              <label htmlFor="ef-message" className={styles.fieldLabel}>Tell me more</label>
              <textarea
                id="ef-message"
                name="message"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={styles.textarea}
                placeholder="Anything that helps Paul understand what you're after"
                rows={5}
              />
            </div>

          </div>

          {/* Error message */}
          {status === 'error' && (
            <p className={styles.errorMsg} role="alert">
              Something went wrong — please try again.
            </p>
          )}

          {/* Submit row */}
          <div className={styles.submitRow}>
            <PingaButton
              variant="sweep"
              type="submit"
              disabled={status === 'sending'}
              className={styles.submitButton}
            >
              {status === 'sending' ? 'Sending…' : 'Send enquiry'}
              {/*
               * Decorative right-pointing triangle — inside the button, after the text.
               * Hand-coded here — not a PingaButton feature.
               * See docs/ui-components.md — The triangle note.
               */}
              <span className={styles.triangle} aria-hidden="true" />
            </PingaButton>
          </div>

        </form>
      </div>
    </section>
  )
}
