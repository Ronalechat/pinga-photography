import { storyblokEditable } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import KineticGrid, { type PhotoConfig } from '@/components/sections/KineticGrid/KineticGrid'
import { toSlug } from '@/utils/toSlug'

interface SbAsset {
  filename: string
  alt?: string
}

interface KineticGridPhotoBlok extends SbBlokData {
  image: SbAsset
  category?: string
  ratio_w?: number | ''
  ratio_h?: number | ''
  num?: string
}

interface KineticGridBlokShape extends SbBlokData {
  photos: KineticGridPhotoBlok[]
  all_preview_count: number | ''
  eyebrow: string
  show_all_photos?: boolean
}

export default function KineticGridBlok({
  blok,
  defaultCategory,
}: {
  blok: KineticGridBlokShape
  defaultCategory?: string
}) {
  const categories: Record<string, PhotoConfig[]> = {}

  for (const p of blok.photos ?? []) {
    const cat = p.category?.trim() || 'Uncategorised'

    if (!categories[cat]) categories[cat] = []

    categories[cat].push({
      cat,
      src:   p.image?.filename || undefined,
      ratio: [p.ratio_w || 3, p.ratio_h || 4],
      num:   p.num || String(categories[cat].length + 1).padStart(2, '0'),
    })
  }

  const resolvedDefault = defaultCategory
    ? Object.keys(categories).find((k) => toSlug(k) === defaultCategory)
    : undefined

  return (
    <section {...storyblokEditable(blok)} className="clip-x">
      <KineticGrid
        categories={categories}
        allPreviewCount={blok.all_preview_count || undefined}
        eyebrow={blok.eyebrow || undefined}
        defaultCategory={resolvedDefault}
        showAllPhotos={blok.show_all_photos}
      />
    </section>
  )
}
