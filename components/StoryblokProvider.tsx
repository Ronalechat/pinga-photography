'use client'
import { storyblokInit, apiPlugin } from '@storyblok/react'
import { components } from '@/lib/components'

storyblokInit({
  accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN,
  use: [apiPlugin],
  components,
  bridge: process.env.NODE_ENV !== 'production',
  apiOptions: { region: 'eu' },
})

export default function StoryblokProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
