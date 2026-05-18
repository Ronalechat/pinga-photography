import { storyblokInit, apiPlugin, getStoryblokApi } from '@storyblok/react/rsc'
import { draftMode } from 'next/headers'
import { components } from './components'

storyblokInit({
  accessToken: process.env.STORYBLOK_PREVIEW_TOKEN,
  use: [apiPlugin],
  components,
  apiOptions: { region: 'eu' },
})

export { getStoryblokApi }

function getForcedVersion() {
  const version = process.env.STORYBLOK_VERSION

  return version === 'draft' || version === 'published' ? version : null
}

export async function getVersion(): Promise<'draft' | 'published'> {
  const forcedVersion = getForcedVersion()
  if (forcedVersion) return forcedVersion
  if (process.env.NODE_ENV === 'development') return 'draft'
  const draft = await draftMode()
  return draft.isEnabled ? 'draft' : 'published'
}
