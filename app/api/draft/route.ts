import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const rawSlug = searchParams.get('slug') ?? '/'

  if (token !== process.env.STORYBLOK_PREVIEW_TOKEN) {
    return new Response('Invalid token', { status: 401 })
  }

  // Storyblok passes full_slug without a leading slash (e.g. 'home', 'gallery').
  // Map 'home' to the root route; ensure all other slugs have a leading slash.
  const slug =
    rawSlug === 'home' || rawSlug === '/'
      ? '/'
      : rawSlug.startsWith('/')
        ? rawSlug
        : `/${rawSlug}`

  const draft = await draftMode()
  draft.enable()
  redirect(slug)
}
