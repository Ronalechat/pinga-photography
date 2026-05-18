'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import PingaButton from '@/components/ui/Button/PingaButton'
import Typography from '@/components/ui/Typography/Typography'
import type { ShopAdminSummary } from '@/lib/shop/adminSummary'
import {
  getSelectedOptionsLabel,
  getShippingAddressLabel,
} from '@/lib/shop/display'
import { formatMoney } from '@/lib/shop/money'
import styles from './AdminShopDashboard.module.css'

type AuthStatus = 'checking' | 'login' | 'setup' | 'ready'
type DashboardStatus = 'idle' | 'loading' | 'ready' | 'setup' | 'unauthorised' | 'error'
type MutationStatus = 'idle' | 'saving'
type HistoryStatusFilter = 'all' | string
type AuthCodeField = 'pin' | 'confirm'

interface HistoryState {
  orderStatus: HistoryStatusFilter
  enquiryStatus: HistoryStatusFilter
  reservationStatus: HistoryStatusFilter
  inventoryMode: HistoryStatusFilter
  ordersOffset: number
  enquiriesOffset: number
  reservationsOffset: number
  inventoryOffset: number
  limit: number
}

interface DashboardResponse extends Partial<ShopAdminSummary> {
  error?: string
  setupRequired?: boolean
  missing?: string[]
}

interface SessionResponse {
  authenticated?: boolean
  username?: string
  csrfToken?: string
  setupRequired?: boolean
}

interface LoginResponse {
  username?: string
  csrfToken?: string
  error?: string
  setupRequired?: boolean
  setupVerified?: boolean
}

const DEFAULT_HISTORY: HistoryState = {
  orderStatus: 'all',
  enquiryStatus: 'all',
  reservationStatus: 'active',
  inventoryMode: 'all',
  ordersOffset: 0,
  enquiriesOffset: 0,
  reservationsOffset: 0,
  inventoryOffset: 0,
  limit: 10,
}

const ORDER_STATUS_OPTIONS = [
  ['all', 'All orders'],
  ['pending', 'Pending'],
  ['paid', 'Paid'],
  ['fulfilled', 'Fulfilled'],
  ['refunded', 'Refunded'],
  ['cancelled', 'Cancelled'],
] as const

const ENQUIRY_STATUS_OPTIONS = [
  ['all', 'All enquiries'],
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['closed', 'Closed'],
] as const

const RESERVATION_STATUS_OPTIONS = [
  ['active', 'Active'],
  ['all', 'All holds'],
  ['converted', 'Converted'],
  ['released', 'Released'],
  ['expired', 'Expired'],
] as const

const INVENTORY_MODE_OPTIONS = [
  ['all', 'All stock'],
  ['limited', 'Limited'],
  ['one_of_one', 'One of one'],
  ['unlimited', 'Unlimited'],
  ['enquiry_goal', 'Enquiry goal'],
] as const

const PAGE_LIMIT_OPTIONS = [10, 20, 50] as const
const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback
  const response = data as DashboardResponse
  return response.error || fallback
}

function isAuthFailure(statusCode: number) {
  return statusCode === 401 || statusCode === 403
}

function buildSummaryUrl(history: HistoryState) {
  const params = new URLSearchParams({
    orderStatus: history.orderStatus,
    enquiryStatus: history.enquiryStatus,
    reservationStatus: history.reservationStatus,
    inventoryMode: history.inventoryMode,
    ordersLimit: history.limit.toString(),
    enquiriesLimit: history.limit.toString(),
    reservationsLimit: history.limit.toString(),
    inventoryLimit: history.limit.toString(),
    ordersOffset: history.ordersOffset.toString(),
    enquiriesOffset: history.enquiriesOffset.toString(),
    reservationsOffset: history.reservationsOffset.toString(),
    inventoryOffset: history.inventoryOffset.toString(),
  })

  return `/api/admin/shop/summary?${params.toString()}`
}

function canFulfilOrder(status: string) {
  return status === 'paid'
}

function canRefundOrder(status: string) {
  return status === 'paid' || status === 'fulfilled'
}

function canCancelOrder(status: string) {
  return status === 'pending'
}

function formatReservationExpiry(value: string) {
  const expiresAt = new Date(value)
  const minutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000)

  if (minutes <= 0) return 'Expired'
  if (minutes === 1) return '1 min left'
  if (minutes < 60) return `${minutes} mins left`

  return formatDate(value)
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className={styles.empty}>
      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
        {label}
      </Typography>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ReadonlyArray<readonly [string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className={styles.compactField}>
      <Typography variant="caption" as="span">
        {label}
      </Typography>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function PageControls({
  offset,
  limit,
  hasMore,
  disabled,
  onChange,
}: {
  offset: number
  limit: number
  hasMore: boolean
  disabled: boolean
  onChange: (offset: number) => void
}) {
  const canGoNewer = offset > 0
  const canGoOlder = hasMore

  if (!canGoNewer && !canGoOlder) return null

  return (
    <div className={styles.actions}>
      {canGoNewer && (
        <button
          type="button"
          className={styles.textAction}
          disabled={disabled}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          <Typography variant="caption" as="span">
            Newer
          </Typography>
        </button>
      )}
      {canGoOlder && (
        <button
          type="button"
          className={styles.textAction}
          disabled={disabled}
          onClick={() => onChange(offset + limit)}
        >
          <Typography variant="caption" as="span">
            Older
          </Typography>
        </button>
      )}
    </div>
  )
}

function handlePressPointer(
  event: React.PointerEvent<HTMLButtonElement>,
  action: () => void
) {
  if (event.pointerType === 'mouse') return

  event.preventDefault()
  event.currentTarget.dataset.pointerHandled = 'true'
  action()
}

function handlePressClick(
  event: React.MouseEvent<HTMLButtonElement>,
  action: () => void
) {
  if (event.currentTarget.dataset.pointerHandled === 'true') {
    event.currentTarget.dataset.pointerHandled = ''
    return
  }

  action()
}

function handlePressKey(
  event: React.KeyboardEvent<HTMLButtonElement>,
  action: () => void
) {
  if (event.key !== 'Enter' && event.key !== ' ') return

  event.preventDefault()
  action()
}

function MaskedCodeField({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string
  value: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={[
        styles.codeField,
        selected ? styles.codeFieldSelected : '',
      ].filter(Boolean).join(' ')}
      onClick={(event) => handlePressClick(event, onSelect)}
      onPointerDown={(event) => handlePressPointer(event, onSelect)}
      onKeyDown={(event) => handlePressKey(event, onSelect)}
      aria-pressed={selected}
    >
      <Typography variant="caption" as="span">
        {label}
      </Typography>
      <Typography variant="body" as="span" className={styles.codeValue}>
        {value ? '•'.repeat(value.length) : 'Select'}
      </Typography>
    </button>
  )
}

function NumericKeypad({
  activeLabel,
  onDigit,
  onDelete,
  onClear,
}: {
  activeLabel: string
  onDigit: (digit: string) => void
  onDelete: () => void
  onClear: () => void
}) {
  return (
    <div className={styles.keypad} aria-label={`${activeLabel} numeric keypad`}>
      {KEYPAD_DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className={styles.keypadKey}
          onClick={(event) => handlePressClick(event, () => onDigit(digit))}
          onPointerDown={(event) => handlePressPointer(event, () => onDigit(digit))}
          onKeyDown={(event) => handlePressKey(event, () => onDigit(digit))}
          aria-label={`${activeLabel} digit ${digit}`}
        >
          <Typography variant="bodyLarge" as="span">
            {digit}
          </Typography>
        </button>
      ))}
      <button
        type="button"
        className={styles.keypadAction}
        onClick={(event) => handlePressClick(event, onDelete)}
        onPointerDown={(event) => handlePressPointer(event, onDelete)}
        onKeyDown={(event) => handlePressKey(event, onDelete)}
      >
        <Typography variant="caption" as="span">
          Delete
        </Typography>
      </button>
      <button
        type="button"
        className={styles.keypadAction}
        onClick={(event) => handlePressClick(event, onClear)}
        onPointerDown={(event) => handlePressPointer(event, onClear)}
        onKeyDown={(event) => handlePressKey(event, onClear)}
      >
        <Typography variant="caption" as="span">
          Clear
        </Typography>
      </button>
    </div>
  )
}

export default function AdminShopDashboard() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const [authMessage, setAuthMessage] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [setupSecret, setSetupSecret] = useState('')
  const [activeCodeField, setActiveCodeField] = useState<AuthCodeField>('pin')
  const [activeUser, setActiveUser] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const [summary, setSummary] = useState<ShopAdminSummary | null>(null)
  const [status, setStatus] = useState<DashboardStatus>('idle')
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>('idle')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<HistoryState>(DEFAULT_HISTORY)
  const [inventoryProductId, setInventoryProductId] = useState('')
  const [inventoryMode, setInventoryMode] = useState('limited')
  const [inventoryQuantity, setInventoryQuantity] = useState('')

  const metrics = useMemo(() => {
    const paidOrders = summary?.orders.filter((order) => order.status === 'paid') ?? []
    const totalRevenue = paidOrders.reduce((total, order) => total + order.total_cents, 0)
    const currency = paidOrders[0]?.currency ?? 'AUD'
    const activeInventory = summary?.inventory.filter((item) => (
      item.stock_quantity === null || item.sold_quantity < item.stock_quantity
    )).length ?? 0
    const pendingOrders = summary?.orders.filter((order) => order.status === 'pending').length ?? 0
    const activeReservations = summary?.reservations.filter((reservation) => (
      reservation.status === 'active'
    )).length ?? 0

    return {
      orderCount: summary?.orders.length ?? 0,
      enquiryCount: summary?.enquiries.length ?? 0,
      activeInventory,
      pendingOrders,
      activeReservations,
      totalRevenue,
      currency,
    }
  }, [summary])

  const handleSessionExpiry = useCallback(() => {
    void fetch('/api/admin/shop/logout', { method: 'POST' }).catch(() => undefined)
    setSummary(null)
    setActiveUser('')
    setCsrfToken('')
    setPin('')
    setConfirmPin('')
    setSetupSecret('')
    setMessage('')
    setMutationStatus('idle')
    setAuthStatus('login')
    setStatus('idle')
    setActiveCodeField('pin')
    setAuthMessage("You've been logged out. Enter your code to continue.")
  }, [])

  const handleLoadSummary = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setStatus('loading')
    setMessage('')

    try {
      const res = await fetch(buildSummaryUrl(history))
      const data = await res.json().catch(() => null) as unknown

      if (!res.ok) {
        if (isAuthFailure(res.status)) {
          handleSessionExpiry()
          return
        }

        const nextStatus: DashboardStatus = data && typeof data === 'object' && (data as DashboardResponse).setupRequired
            ? 'setup'
            : 'error'

        setStatus(nextStatus)
        setMessage(getErrorMessage(data, 'Shop admin data could not be loaded.'))
        return
      }

      setAuthMessage('')
      const response = data as ShopAdminSummary
      setSummary(response)
      setStatus('ready')
    } catch {
      setStatus('error')
      setMessage('Shop admin data could not be loaded.')
    }
  }, [handleSessionExpiry, history])

  const checkSession = useCallback(async () => {
    setAuthStatus('checking')
    setAuthMessage('')

    try {
      const res = await fetch('/api/admin/shop/session')
      const data = await res.json().catch(() => null) as unknown

      if (res.ok && data && typeof data === 'object' && (data as SessionResponse).authenticated) {
        const response = data as SessionResponse
        const nextUser = response.username ?? ''
        setActiveUser(nextUser)
        setCsrfToken(response.csrfToken ?? '')
        setAuthStatus('ready')
        return
      }

      setSummary(null)
      setActiveUser('')
      setCsrfToken('')
      setStatus('idle')
      setAuthStatus('login')
      if (res.status === 401) {
        setAuthMessage("You've been logged out. Enter your code to continue.")
      } else if (data && typeof data === 'object' && (data as SessionResponse).setupRequired) {
        setAuthMessage('Admin entry is not fully configured yet.')
      }
    } catch {
      setAuthStatus('login')
      setAuthMessage('Admin session could not be checked.')
    }
  }, [])

  async function handleMutation(path: string, body: unknown) {
    setMutationStatus('saving')
    setMessage('')

    try {
      if (!csrfToken) {
        setMessage('Admin request could not be verified. Refresh the dashboard and try again.')
        return
      }

      const res = await fetch(path, {
        method: path.endsWith('/inventory') || path.endsWith('/release-expired') ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Pinga-Shop-CSRF': csrfToken,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null) as unknown

      if (!res.ok) {
        if (isAuthFailure(res.status)) {
          handleSessionExpiry()
          return
        }

        setMessage(getErrorMessage(data, 'Shop admin update failed.'))
        setStatus(data && typeof data === 'object' && (data as DashboardResponse).setupRequired
          ? 'setup'
          : 'error')
        return
      }

      await handleLoadSummary({ showLoading: false })
    } catch {
      setStatus('error')
      setMessage('Shop admin update failed.')
    } finally {
      setMutationStatus('idle')
    }
  }

  function updateOrder(orderId: string, nextStatus: string) {
    return handleMutation(`/api/admin/shop/orders/${orderId}`, { status: nextStatus })
  }

  function updateEnquiry(enquiryId: string, nextStatus: string) {
    return handleMutation(`/api/admin/shop/enquiries/${enquiryId}`, { status: nextStatus })
  }

  function upsertInventoryRow() {
    return handleMutation('/api/admin/shop/inventory', {
      productId: inventoryProductId,
      stockMode: inventoryMode,
      stockQuantity: inventoryQuantity ? Number(inventoryQuantity) : null,
    })
  }

  function releaseExpiredReservationRows() {
    return handleMutation('/api/admin/shop/reservations/release-expired', {})
  }

  function updateHistory(patch: Partial<HistoryState>) {
    setHistory((current) => ({
      ...current,
      ...patch,
    }))
  }

  function updateHistoryFilter(patch: Partial<HistoryState>) {
    setHistory((current) => ({
      ...current,
      ...patch,
      ordersOffset: patch.orderStatus === undefined ? current.ordersOffset : 0,
      enquiriesOffset: patch.enquiryStatus === undefined ? current.enquiriesOffset : 0,
      reservationsOffset: patch.reservationStatus === undefined ? current.reservationsOffset : 0,
      inventoryOffset: patch.inventoryMode === undefined ? current.inventoryOffset : 0,
    }))
  }

  function handleCodeDigit(digit: string) {
    if (activeCodeField === 'pin') {
      setPin((current) => `${current}${digit}`)
      return
    }

    if (activeCodeField === 'confirm') {
      setConfirmPin((current) => `${current}${digit}`)
    }
  }

  function handleCodeDelete() {
    if (activeCodeField === 'pin') {
      setPin((current) => current.slice(0, -1))
      return
    }

    if (activeCodeField === 'confirm') {
      setConfirmPin((current) => current.slice(0, -1))
    }
  }

  function handleCodeClear() {
    if (activeCodeField === 'pin') {
      setPin('')
      return
    }

    if (activeCodeField === 'confirm') {
      setConfirmPin('')
    }
  }

  function canSubmitAuth() {
    if (!username || pin.length < 6) return false

    if (authStatus !== 'setup') return true

    return confirmPin.length >= 6 && Boolean(setupSecret)
  }

  function handleUsernameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || !canSubmitAuth()) return

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAuthMessage('')

    if (!canSubmitAuth()) return

    if (authStatus === 'setup' && pin !== confirmPin) {
      setConfirmPin('')
      setActiveCodeField('confirm')
      setAuthMessage('Codes did not match. Enter the same code again.')
      return
    }

    try {
      const res = await fetch('/api/admin/shop/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          pin,
          setupSecret: authStatus === 'setup' ? setupSecret : undefined,
        }),
      })
      const data = await res.json().catch(() => null) as unknown
      const response = data && typeof data === 'object' ? data as LoginResponse : null

      if (!res.ok) {
        if (response?.setupVerified && authStatus !== 'setup') {
          setAuthStatus('setup')
          setSetupSecret(pin)
          setPin('')
          setConfirmPin('')
          setActiveCodeField('pin')
          setAuthMessage('Set your admin code, then repeat it.')
          return
        }

        if (authStatus === 'setup' && setupSecret) {
          setAuthStatus('login')
          setPin('')
          setConfirmPin('')
          setSetupSecret('')
          setActiveCodeField('pin')
          setAuthMessage('Setup could not be verified. Enter the setup key again.')
        } else {
          setAuthMessage(response?.error ?? 'Entry could not be verified.')
        }
        return
      }

      setPin('')
      setConfirmPin('')
      setSetupSecret('')
      setActiveUser(response?.username ?? username)
      setCsrfToken(response?.csrfToken ?? '')
      setAuthStatus('ready')
    } catch {
      setAuthMessage('Entry could not be verified.')
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/shop/logout', { method: 'POST' }).catch(() => undefined)
    setSummary(null)
    setActiveUser('')
    setCsrfToken('')
    setPin('')
    setConfirmPin('')
    setSetupSecret('')
    setStatus('idle')
    setAuthStatus('login')
  }

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  useEffect(() => {
    if (authStatus === 'ready') void handleLoadSummary()
  }, [authStatus, handleLoadSummary])

  useEffect(() => {
    if (authStatus === 'setup') setActiveCodeField('pin')
    if (authStatus === 'login') setActiveCodeField('pin')
  }, [authStatus])

  if (authStatus === 'checking') {
    return (
      <section className={styles.root} aria-labelledby="shop-admin-dashboard">
        <div className={styles.skeletonGrid} aria-hidden="true">
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      </section>
    )
  }

  if (authStatus === 'login' || authStatus === 'setup') {
    return (
      <section className={styles.root} aria-labelledby="shop-admin-dashboard">
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <Typography variant="eyebrow" as="h2" id="shop-admin-dashboard">
              Dashboard entry
            </Typography>
            <Typography variant="body" as="p" color="var(--color-text-muted-high)">
              {authStatus === 'setup'
                ? 'Set your admin code, then repeat it.'
                : 'Enter your admin code. For first-time setup, enter the setup key once.'}
            </Typography>
          </div>

          <form className={styles.auth} onSubmit={handleLogin}>
            {authStatus === 'setup' ? (
              <div className={styles.tokenField}>
                <Typography variant="caption" as="span">
                  Username
                </Typography>
                <Typography variant="body" as="p">
                  {username}
                </Typography>
              </div>
            ) : (
              <label className={styles.tokenField}>
                <Typography variant="caption" as="span">
                  Username
                </Typography>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={styles.input}
                  autoComplete="username"
                  spellCheck={false}
                  onKeyDown={handleUsernameKeyDown}
                />
              </label>
            )}

            <div className={styles.codeFields}>
              <MaskedCodeField
                label={authStatus === 'setup' ? 'Set your code' : 'Code'}
                value={pin}
                selected={activeCodeField === 'pin'}
                onSelect={() => setActiveCodeField('pin')}
              />

              {authStatus === 'setup' && (
                <>
                  <MaskedCodeField
                    label="Repeat code"
                    value={confirmPin}
                    selected={activeCodeField === 'confirm'}
                    onSelect={() => setActiveCodeField('confirm')}
                  />
                </>
              )}
            </div>

            <NumericKeypad
              activeLabel={
                activeCodeField === 'pin'
                  ? authStatus === 'setup' ? 'Set your code' : 'Code'
                  : 'Repeat code'
              }
              onDigit={handleCodeDigit}
              onDelete={handleCodeDelete}
              onClear={handleCodeClear}
            />

            <PingaButton
              variant="ghost"
              type="submit"
              className={styles.enterButton}
              disabled={!canSubmitAuth()}
            >
              <span className={styles.enterButtonContent}>
                Enter
                <span className={styles.enterIcon} aria-hidden="true" />
              </span>
            </PingaButton>
          </form>
        </div>

        {authMessage && (
          <Typography variant="caption" as="p" role="status" className={styles.notice}>
            {authMessage}
          </Typography>
        )}
      </section>
    )
  }

  return (
    <section className={styles.root} aria-labelledby="shop-admin-dashboard">
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <Typography variant="eyebrow" as="h2" id="shop-admin-dashboard">
            Dashboard
          </Typography>
          <Typography variant="body" as="p" color="var(--color-text-muted-high)">
            Live shop data is loaded for signed-in admins only.
          </Typography>
        </div>

        <div className={styles.authSession}>
          <div>
            <Typography variant="caption" as="span">
              Signed in
            </Typography>
            <Typography variant="body" as="p">
              {activeUser}
            </Typography>
          </div>
          <PingaButton
            variant="ghost"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </PingaButton>
        </div>
      </div>

      {message && (
        <Typography
          variant="caption"
          as="p"
          role="status"
          className={status === 'setup' ? styles.notice : styles.error}
        >
          {message}
        </Typography>
      )}

      {status === 'loading' && (
        <div className={styles.skeletonGrid} aria-hidden="true">
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}

      {summary && status === 'ready' && (
        <>
          <div className={styles.historyControls}>
            <FilterSelect
              label="Orders"
              value={history.orderStatus}
              options={ORDER_STATUS_OPTIONS}
              onChange={(value) => updateHistoryFilter({ orderStatus: value })}
            />
            <FilterSelect
              label="Enquiries"
              value={history.enquiryStatus}
              options={ENQUIRY_STATUS_OPTIONS}
              onChange={(value) => updateHistoryFilter({ enquiryStatus: value })}
            />
            <FilterSelect
              label="Reservations"
              value={history.reservationStatus}
              options={RESERVATION_STATUS_OPTIONS}
              onChange={(value) => updateHistoryFilter({ reservationStatus: value })}
            />
            <FilterSelect
              label="Stock"
              value={history.inventoryMode}
              options={INVENTORY_MODE_OPTIONS}
              onChange={(value) => updateHistoryFilter({ inventoryMode: value })}
            />
            <label className={styles.compactField}>
              <Typography variant="caption" as="span">
                Rows
              </Typography>
              <select
                value={history.limit}
                onChange={(event) => updateHistory({
                  limit: Number(event.target.value),
                  ordersOffset: 0,
                  enquiriesOffset: 0,
                  reservationsOffset: 0,
                  inventoryOffset: 0,
                })}
                className={styles.input}
              >
                {PAGE_LIMIT_OPTIONS.map((limit) => (
                  <option key={limit} value={limit}>
                    {limit}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.textAction}
              disabled={mutationStatus === 'saving'}
              onClick={() => handleLoadSummary()}
            >
              <Typography variant="caption" as="span">
                Refresh
              </Typography>
            </button>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Orders
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.orderCount}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Enquiries
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.enquiryCount}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Paid total
              </Typography>
              <Typography variant="headingMedium" as="p">
                {formatMoney(metrics.totalRevenue, metrics.currency)}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Active stock
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.activeInventory}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Pending
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.pendingOrders}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Held stock
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.activeReservations}
              </Typography>
            </div>
          </div>

          <div className={styles.tables}>
            <section className={styles.tableSection} aria-labelledby="admin-orders">
              <div className={styles.sectionHeader}>
                <Typography variant="eyebrow" as="h3" id="admin-orders">
                  Orders
                </Typography>
                <PageControls
                  offset={summary.pagination?.orders.offset ?? 0}
                  limit={summary.pagination?.orders.limit ?? history.limit}
                  hasMore={summary.pagination?.orders.hasMore ?? false}
                  disabled={mutationStatus === 'saving'}
                  onChange={(offset) => updateHistory({ ordersOffset: offset })}
                />
              </div>
              {summary.orders.length === 0 ? (
                <EmptyState label="No orders yet." />
              ) : (
                <div className={styles.rows}>
                  {summary.orders.map((order) => (
                    <div key={order.id} className={styles.record}>
                      <div className={styles.recordTopline}>
                        <div>
                          <Typography variant="body" as="p">
                            {order.customer_name || order.customer_email || 'Awaiting Stripe details'}
                          </Typography>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            {order.status} / {formatDate(order.created_at)}
                          </Typography>
                        </div>
                        <Typography variant="body" as="p">
                          {formatMoney(order.total_cents, order.currency)}
                        </Typography>
                      </div>

                      <div className={styles.detailGrid}>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Contact
                          </Typography>
                          <Typography variant="caption" as="p">
                            {order.customer_email ?? 'No email yet'}
                          </Typography>
                          {order.customer_phone && (
                            <Typography variant="caption" as="p">
                              {order.customer_phone}
                            </Typography>
                          )}
                        </div>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Shipping
                          </Typography>
                          <Typography variant="caption" as="p">
                            {order.shipping_option_label ?? 'Not selected'} / {formatMoney(order.shipping_cents, order.currency)}
                          </Typography>
                          {getShippingAddressLabel(order.shipping_address) && (
                            <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                              {getShippingAddressLabel(order.shipping_address)}
                            </Typography>
                          )}
                        </div>
                      </div>

                      {order.shop_order_items && order.shop_order_items.length > 0 && (
                        <div className={styles.recordItems}>
                          {order.shop_order_items.map((item) => (
                            <div key={item.id} className={styles.recordItem}>
                              <Typography variant="caption" as="p">
                                {item.quantity} x {item.title}
                              </Typography>
                              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                                {getSelectedOptionsLabel(item.selected_options) || item.product_id}
                              </Typography>
                              <Typography variant="caption" as="p">
                                {formatMoney(item.unit_amount_cents, item.currency)}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.actions}>
                        {canCancelOrder(order.status) && (
                          <button
                            type="button"
                            className={styles.textAction}
                            disabled={mutationStatus === 'saving'}
                            onClick={() => updateOrder(order.id, 'cancelled')}
                          >
                            <Typography variant="caption" as="span">
                              Cancel
                            </Typography>
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving' || !canFulfilOrder(order.status)}
                          onClick={() => updateOrder(order.id, 'fulfilled')}
                        >
                          <Typography variant="caption" as="span">
                            Fulfil
                          </Typography>
                        </button>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving' || !canRefundOrder(order.status)}
                          onClick={() => updateOrder(order.id, 'refunded')}
                        >
                          <Typography variant="caption" as="span">
                            Refunded
                          </Typography>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.tableSection} aria-labelledby="admin-enquiries">
              <div className={styles.sectionHeader}>
                <Typography variant="eyebrow" as="h3" id="admin-enquiries">
                  Enquiries
                </Typography>
                <PageControls
                  offset={summary.pagination?.enquiries.offset ?? 0}
                  limit={summary.pagination?.enquiries.limit ?? history.limit}
                  hasMore={summary.pagination?.enquiries.hasMore ?? false}
                  disabled={mutationStatus === 'saving'}
                  onChange={(offset) => updateHistory({ enquiriesOffset: offset })}
                />
              </div>
              {summary.enquiries.length === 0 ? (
                <EmptyState label="No enquiries yet." />
              ) : (
                <div className={styles.rows}>
                  {summary.enquiries.map((enquiry) => (
                    <div key={enquiry.id} className={styles.record}>
                      <div className={styles.recordTopline}>
                        <div>
                          <Typography variant="body" as="p">
                            {enquiry.product_title ?? 'Product enquiry'}
                          </Typography>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            {enquiry.status} / {formatDate(enquiry.created_at)}
                          </Typography>
                        </div>
                        <Typography variant="body" as="p">
                          Qty {enquiry.quantity}
                        </Typography>
                      </div>
                      <div className={styles.detailGrid}>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Contact
                          </Typography>
                          <Typography variant="caption" as="p">
                            {enquiry.customer_name} / {enquiry.customer_email}
                          </Typography>
                          {enquiry.customer_phone && (
                            <Typography variant="caption" as="p">
                              {enquiry.customer_phone}
                            </Typography>
                          )}
                        </div>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Selection
                          </Typography>
                          <Typography variant="caption" as="p">
                            {getSelectedOptionsLabel(enquiry.selected_options) || enquiry.product_id || 'No options'}
                          </Typography>
                          {enquiry.message && (
                            <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                              {enquiry.message}
                            </Typography>
                          )}
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={
                            mutationStatus === 'saving' ||
                            enquiry.status === 'contacted' ||
                            enquiry.status === 'closed'
                          }
                          onClick={() => updateEnquiry(enquiry.id, 'contacted')}
                        >
                          <Typography variant="caption" as="span">
                            Contacted
                          </Typography>
                        </button>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving' || enquiry.status === 'closed'}
                          onClick={() => updateEnquiry(enquiry.id, 'closed')}
                        >
                          <Typography variant="caption" as="span">
                            Closed
                          </Typography>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.tableSection} aria-labelledby="admin-reservations">
              <div className={styles.sectionHeader}>
                <Typography variant="eyebrow" as="h3" id="admin-reservations">
                  Reservations
                </Typography>
                <div className={styles.headerActions}>
                  <PageControls
                    offset={summary.pagination?.reservations.offset ?? 0}
                    limit={summary.pagination?.reservations.limit ?? history.limit}
                    hasMore={summary.pagination?.reservations.hasMore ?? false}
                    disabled={mutationStatus === 'saving'}
                    onChange={(offset) => updateHistory({ reservationsOffset: offset })}
                  />
                  <button
                    type="button"
                    className={styles.textAction}
                    disabled={mutationStatus === 'saving'}
                    onClick={releaseExpiredReservationRows}
                  >
                    <Typography variant="caption" as="span">
                      Release expired
                    </Typography>
                  </button>
                </div>
              </div>
              {summary.reservations.length === 0 ? (
                <EmptyState label="No held stock right now." />
              ) : (
                <div className={styles.rows}>
                  {summary.reservations.map((reservation) => (
                    <div key={reservation.id} className={styles.row}>
                      <Typography variant="body" as="p">
                        {reservation.product_id}
                      </Typography>
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {reservation.option_signature || 'Default'}
                      </Typography>
                      <Typography variant="body" as="p">
                        Qty {reservation.quantity}
                      </Typography>
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {formatReservationExpiry(reservation.expires_at)}
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.tableSection} aria-labelledby="admin-inventory">
              <div className={styles.sectionHeader}>
                <div>
                  <Typography variant="eyebrow" as="h3" id="admin-inventory">
                    Inventory
                  </Typography>
                  <PageControls
                    offset={summary.pagination?.inventory.offset ?? 0}
                    limit={summary.pagination?.inventory.limit ?? history.limit}
                    hasMore={summary.pagination?.inventory.hasMore ?? false}
                    disabled={mutationStatus === 'saving'}
                    onChange={(offset) => updateHistory({ inventoryOffset: offset })}
                  />
                </div>
                <div className={styles.inventoryForm}>
                  <label className={styles.compactField}>
                    <Typography variant="caption" as="span">
                      Product ID
                    </Typography>
                    <input
                      value={inventoryProductId}
                      onChange={(event) => setInventoryProductId(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.compactField}>
                    <Typography variant="caption" as="span">
                      Mode
                    </Typography>
                    <select
                      value={inventoryMode}
                      onChange={(event) => setInventoryMode(event.target.value)}
                      className={styles.input}
                    >
                      <option value="limited">Limited</option>
                      <option value="one_of_one">One of one</option>
                      <option value="unlimited">Unlimited</option>
                      <option value="enquiry_goal">Enquiry goal</option>
                    </select>
                  </label>
                  <label className={styles.compactField}>
                    <Typography variant="caption" as="span">
                      Stock
                    </Typography>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={inventoryQuantity}
                      onChange={(event) => setInventoryQuantity(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.textAction}
                    disabled={mutationStatus === 'saving' || !inventoryProductId}
                    onClick={upsertInventoryRow}
                  >
                    <Typography variant="caption" as="span">
                      Save stock
                    </Typography>
                  </button>
                </div>
              </div>
              {summary.inventory.length === 0 ? (
                <EmptyState label="No inventory rows yet." />
              ) : (
                <div className={styles.rows}>
                  {summary.inventory.map((item) => (
                    <div key={item.product_id} className={styles.row}>
                      <Typography variant="body" as="p">
                        {item.product_id}
                      </Typography>
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {item.stock_mode}
                      </Typography>
                      <Typography variant="body" as="p">
                        {item.stock_quantity === null
                          ? `${item.sold_quantity} sold`
                          : `${Math.max(0, item.stock_quantity - item.sold_quantity)} left`}
                      </Typography>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving'}
                          onClick={() => {
                            setInventoryProductId(item.product_id)
                            setInventoryMode(item.stock_mode)
                            setInventoryQuantity(item.stock_quantity?.toString() ?? '')
                          }}
                        >
                          <Typography variant="caption" as="span">
                            Edit
                          </Typography>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  )
}
