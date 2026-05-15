import type { Metadata } from "next";
import StoryblokProvider from "@/components/StoryblokProvider";
import SiteHeader from "@/components/sections/SiteHeader/SiteHeader";
import SiteFooter from "@/components/sections/SiteFooter/SiteFooter";
import PageTransition from "@/components/layout/PageTransition/PageTransition";
import SkipLink from "@/components/ui/SkipLink/SkipLink";
import SitePreloader from "@/components/layout/SitePreloader/SitePreloader";
import ConsentBanner from "@/components/layout/ConsentBanner/ConsentBanner";
import "@/styles/globals.css";

// Preload Jean-Luc fonts to prevent flash of unstyled text on the hero.
// These hints fire before CSS parses, so the fonts are ready when ScrollHero
// animates in. Preload both weights — Bold is used everywhere; Thin is used
// for displayThin in AboutSection.
const fontPreloads = [
  { href: "/fonts/jeanlucweb-bold.woff", weight: "700" },
  { href: "/fonts/jeanlucweb-thin.woff", weight: "100" },
] as const;

export const metadata: Metadata = {
  title: "P!nga Photography — Pinga Matereke | Sydney",
  description:
    "Pinga Matereke (P!nga) — African Australian photographer based in Sydney. " +
    "Street, rave, party, and portrait photography. 35mm film & digital. Available to hire.",
  keywords: [
    "pinga photography",
    "pinga matereke",
    "matereke photography",
    "african australian photographer",
    "sydney street photography",
    "party photographer",
    "rave photographer",
    "underground art sydney",
    "contemporary photographer",
    "35mm film photographer sydney",
    "black and white photographer",
    "street photographer hire",
  ],
  openGraph: {
    title: "P!nga Photography — Pinga Matereke | Sydney",
    description:
      "Pinga Matereke (P!nga) — African Australian photographer based in Sydney. " +
      "Street, rave, party, and portrait photography. 35mm film & digital. Available to hire.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "P!nga Photography — Pinga Matereke | Sydney",
    description:
      "Pinga Matereke (P!nga) — African Australian photographer based in Sydney. " +
      "Street, rave, party, and portrait photography. 35mm film & digital. Available to hire.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {fontPreloads.map(({ href, weight }) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff"
            crossOrigin="anonymous"
            data-font-weight={weight}
          />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Pinga Matereke",
              "alternateName": "P!nga",
              "jobTitle": "Photographer",
              "sameAs": ["https://instagram.com/pinga.matereke"],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Sydney",
                "addressCountry": "AU",
              },
              "knowsAbout": [
                "street photography",
                "rave photography",
                "party photography",
                "portrait photography",
                "film photography",
                "black and white photography",
                "underground art",
              ],
            }),
          }}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#16161D" />
      </head>
      <body suppressHydrationWarning>
        <SitePreloader />
        <ConsentBanner />
        <StoryblokProvider>
          <SkipLink />
          <SiteHeader />
          <div style={{ isolation: "isolate" }}>
            <main id="main-content">
              <PageTransition variant="diagonalWipe">{children}</PageTransition>
            </main>
            <SiteFooter />
          </div>
        </StoryblokProvider>
      </body>
    </html>
  );
}
