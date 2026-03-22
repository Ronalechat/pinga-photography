import Page from '@/components/bloks/Page'
import ScrollHeroBlok from '@/components/bloks/ScrollHeroBlok'
import ImageCarouselBlok from '@/components/bloks/ImageCarouselBlok'
import KineticGridBlok from '@/components/bloks/KineticGridBlok'
import AboutPreviewBlok from '@/components/bloks/AboutPreviewBlok'
import AboutSectionBlok from '@/components/bloks/AboutSectionBlok'
import SiteFooterBlok from '@/components/bloks/SiteFooterBlok'

export const components: Record<string, React.ComponentType<any>> = {
  page:           Page,
  scroll_hero:    ScrollHeroBlok,
  image_carousel: ImageCarouselBlok,
  kinetic_grid:   KineticGridBlok,
  about_preview:  AboutPreviewBlok,
  about_section:  AboutSectionBlok,
  site_footer:    SiteFooterBlok,
}
