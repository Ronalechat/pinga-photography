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

export async function getVersion(): Promise<'draft' | 'published'> {
  if (process.env.NODE_ENV === 'development') return 'draft'
  const draft = await draftMode()
  return draft.isEnabled ? 'draft' : 'published'
}
