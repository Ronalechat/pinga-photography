import Page from '@/components/bloks/Page'
import ScrollHeroBlok from '@/components/bloks/ScrollHeroBlok'
import ImageCarouselBlok from '@/components/bloks/ImageCarouselBlok'
import KineticGridBlok from '@/components/bloks/KineticGridBlok'
import AboutPreviewBlok from '@/components/bloks/AboutPreviewBlok'
import AboutSectionBlok from '@/components/bloks/AboutSectionBlok'
import SiteFooterBlok from '@/components/bloks/SiteFooterBlok'
import EnquiryFormBlok from '@/components/bloks/EnquiryFormBlok'
import ProductEnquiryBlok from '@/components/bloks/ProductEnquiryBlok'

type StoryblokComponent = React.ComponentType<Record<string, unknown>>

export const components: Record<string, StoryblokComponent> = {
  page:            Page as StoryblokComponent,
  scroll_hero:     ScrollHeroBlok as StoryblokComponent,
  image_carousel:  ImageCarouselBlok as StoryblokComponent,
  kinetic_grid:    KineticGridBlok as StoryblokComponent,
  about_preview:   AboutPreviewBlok as StoryblokComponent,
  about_section:   AboutSectionBlok as StoryblokComponent,
  site_footer:     SiteFooterBlok as StoryblokComponent,
  enquiry_form:    EnquiryFormBlok as StoryblokComponent,
  product_enquiry: ProductEnquiryBlok as StoryblokComponent,
}
