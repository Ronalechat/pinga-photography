import { AnalyticsBrowser } from '@segment/analytics-next'

// Singleton instance — loaded once, imported wherever tracking is needed.
// NEXT_PUBLIC_SEGMENT_KEY must be set in .env.local before events will fire.
export const analytics = AnalyticsBrowser.load({
  writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY ?? '',
})
