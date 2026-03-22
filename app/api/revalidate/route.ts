import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-storyblok-webhook-secret')

  if (secret !== process.env.STORYBLOK_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const body = await request.json()
  const slug: string = body.story?.full_slug ?? '/'

  revalidatePath(slug === 'home' ? '/' : `/${slug}`)

  return NextResponse.json({ revalidated: true, slug })
}
