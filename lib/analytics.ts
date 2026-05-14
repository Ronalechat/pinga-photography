import { AnalyticsBrowser } from '@segment/analytics-next'

const OPT_OUT_KEY  = 'analytics_opt_out'
const BANNER_KEY   = 'analytics_banner_seen'
const GATED        = new Set(['track', 'page', 'identify'])

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
  if (typeof window !== 'undefined') {
    localStorage.setItem(BANNER_KEY, 'true')
  }
}

const _base = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY ?? '',
})

// Proxy gates track/page/identify behind the opt-out flag transparently —
// no changes needed at call sites.
export const analytics = new Proxy(_base, {
  get(target, prop) {
    const value = (target as unknown as Record<string, unknown>)[prop as string]
    if (GATED.has(prop as string) && typeof value === 'function') {
      return (...args: unknown[]) => {
        if (isOptedOut()) return Promise.resolve()
        return (value as (...a: unknown[]) => unknown).apply(target, args)
      }
    }
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value
  },
}) as AnalyticsBrowser
