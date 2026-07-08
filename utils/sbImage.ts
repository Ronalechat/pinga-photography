/*
 * sbImage — Storyblok Image Service URL helpers.
 *
 * Storyblok serves original uploads (up to 20MB+) unless a `/m/` transform
 * segment is appended. The service resizes on the fly and negotiates
 * WebP/AVIF via the Accept header, so a 6048px/20MB original becomes a
 * ~200KB viewport-sized file with no visible quality loss.
 *
 * Every image consumer (bloks) should pass filenames through these helpers —
 * never render a raw `asset.filename` directly.
 */

const SB_ASSET_HOST = 'a.storyblok.com'

/** Storyblok embeds the original dimensions in every asset URL: /f/<space>/<W>x<H>/<hash>/<name> */
const DIMS_RE = /\/(\d+)x\d+\//

// ─── Shared sizing presets ────────────────────────────────────────────────────
// Width ladders + `sizes` values used by the image-heavy components. The
// browser picks the entry matching viewport × devicePixelRatio, so every
// device gets native-resolution pixels — no more, no less.

/** Full-bleed surfaces (ScrollHero, ImageCarousel) */
export const FULL_BLEED_WIDTHS = [1080, 1920, 2560, 3200]
export const FULL_BLEED_SIZES = '100vw'
export const FULL_BLEED_QUALITY = 82

/** KineticGrid cards — 1 col mobile, 2 col tablet, ~400px within the 1200px container on desktop */
export const GRID_WIDTHS = [480, 800, 1200]
export const GRID_SIZES = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 400px'
export const GRID_QUALITY = 75

/** Lightbox high-res upgrade tier */
export const LIGHTBOX_WIDTH = 2560
export const LIGHTBOX_QUALITY = 82

/** Product media viewer (shop / product enquiry) */
export const PRODUCT_WIDTH = 1600
export const PRODUCT_QUALITY = 80

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTransformable(filename: string): boolean {
  return (
    filename.includes(SB_ASSET_HOST) &&
    !filename.toLowerCase().endsWith('.svg') &&
    !filename.includes('/m/')
  )
}

/** Original upload width parsed from the asset URL, or null if unrecognisable */
function originalWidth(filename: string): number | null {
  const match = filename.match(DIMS_RE)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Single transformed URL at the given width (height auto from aspect ratio).
 * Width is capped at the original upload width so the service never upscales.
 * Non-Storyblok URLs and SVGs pass through untouched.
 */
export function sbImage(
  filename: string | undefined,
  width: number,
  quality = GRID_QUALITY,
): string | undefined {
  if (!filename) return undefined
  if (!isTransformable(filename)) return filename
  const orig = originalWidth(filename)
  const w = orig ? Math.min(width, orig) : width
  return `${filename}/m/${w}x0/filters:quality(${quality})`
}

/**
 * srcset string across a width ladder, capped at the original width.
 * Returns undefined for non-transformable URLs (the plain src is used instead).
 */
export function sbSrcSet(
  filename: string | undefined,
  widths: number[],
  quality = GRID_QUALITY,
): string | undefined {
  if (!filename || !isTransformable(filename)) return undefined
  const orig = originalWidth(filename)
  const capped = [...new Set(widths.map((w) => (orig ? Math.min(w, orig) : w)))].sort(
    (a, b) => a - b,
  )
  return capped
    .map((w) => `${filename}/m/${w}x0/filters:quality(${quality}) ${w}w`)
    .join(', ')
}
