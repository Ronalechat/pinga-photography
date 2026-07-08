import { storyblokEditable } from "@storyblok/react/rsc";
import type { SbBlokData } from "@storyblok/react/rsc";
import ImageCarousel from "@/components/sections/ImageCarousel/ImageCarousel";
import Container from "../layout/Container/Container";
import {
  sbImage,
  sbSrcSet,
  FULL_BLEED_WIDTHS,
  FULL_BLEED_SIZES,
  FULL_BLEED_QUALITY,
} from "@/utils/sbImage";

interface SbAsset {
  filename: string;
  alt?: string;
}

interface ImageCarouselSlideBlok extends SbBlokData {
  image: SbAsset;
  alt: string;
}

interface ImageCarouselBlokShape extends SbBlokData {
  slides: ImageCarouselSlideBlok[];
  height: string;
}

export default function ImageCarouselBlok({
  blok,
}: {
  blok: ImageCarouselBlokShape;
}) {
  const slides = blok.slides.map((s) => ({
    src: sbImage(s.image?.filename, 1920, FULL_BLEED_QUALITY),
    srcSet: sbSrcSet(s.image?.filename, FULL_BLEED_WIDTHS, FULL_BLEED_QUALITY),
    sizes: FULL_BLEED_SIZES,
    alt: s.alt || s.image?.alt || "",
  }));

  return (
    <Container>
      <section {...storyblokEditable(blok)} className="clip-x">
        <ImageCarousel slides={slides} height={blok.height || undefined} />
      </section>
    </Container>
  );
}
