import { AnalyticsBrowser } from '@segment/analytics-next'

const OPT_OUT_KEY  = 'analytics_opt_out'
const BANNER_KEY   = 'analytics_banner_seen'

const _base = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY ?? '',
})

export function isOptedOut(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(OPT_OUT_KEY) === 'true'
}

export function hasBannerBeenSeen(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(BANNER_KEY) === 'true'
}

export function optOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OPT_OUT_KEY, 'true')
    localStorage.setItem(BANNER_KEY, 'true')
  }
  _base.reset()
}

export function dismissBanner(): void {
  if (typeof window !== 'undefined') localStorage.setItem(BANNER_KEY, 'true')
}

// Gated wrapper — call sites unchanged, opt-out is enforced transparently.
export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    if (isOptedOut()) return
    _base.track(event, properties)
  },
  page: (...args: Parameters<AnalyticsBrowser['page']>) => {
    if (isOptedOut()) return
    return _base.page(...args)
  },
  identify: (...args: Parameters<AnalyticsBrowser['identify']>) => {
    if (isOptedOut()) return
    return _base.identify(...args)
  },
  reset: () => _base.reset(),
}
