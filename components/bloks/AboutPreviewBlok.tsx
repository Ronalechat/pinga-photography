import type { SbBlokData } from "@storyblok/react/rsc";
import AboutPreview, {
  type AboutPreviewBlok,
} from "@/components/sections/AboutPreview/AboutPreview";
import Container from "../layout/Container/Container";

export default function AboutPreviewBlok({ blok }: { blok: AboutPreviewBlok }) {
  return (
    <Container>
      <AboutPreview blok={blok} />
    </Container>
  );
}
