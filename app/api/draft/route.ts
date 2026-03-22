import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const slug = searchParams.get('slug') ?? '/'

  if (token !== process.env.STORYBLOK_PREVIEW_TOKEN) {
    return new Response('Invalid token', { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(slug)
}
