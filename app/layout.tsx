import type { Metadata } from "next";
import StoryblokProvider from "@/components/StoryblokProvider";
import SiteHeader from "@/components/sections/SiteHeader/SiteHeader";
import SiteFooter from "@/components/sections/SiteFooter/SiteFooter";
import PageTransition from "@/components/layout/PageTransition/PageTransition";
import "@/styles/globals.css";

// Preload Jean-Luc fonts to prevent flash of unstyled text on the hero.
// These hints fire before CSS parses, so the fonts are ready when ScrollHero
// animates in. Preload both weights — Bold is used everywhere; Thin is used
// for displayThin in AboutSection.
const fontPreloads = [
  { href: '/fonts/jeanlucweb-bold.woff', weight: '700' },
  { href: '/fonts/jeanlucweb-thin.woff', weight: '100' },
] as const

export const metadata: Metadata = {
  title: "Pinga Matereke Photography",
  description: "Pinga Matereke Photography portfolio and job enquiries",
  openGraph: {
    title: "Pinga Matereke Photography",
    description: "Pinga Matereke Photography portfolio and job enquiries",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinga Matereke Photography",
    description: "Pinga Matereke Photography portfolio and job enquiries",
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
      </head>
      <body suppressHydrationWarning>
        <StoryblokProvider>
          <SiteHeader />
          <div style={{ isolation: 'isolate' }}>
            <PageTransition variant="diagonalWipe">
              {children}
            </PageTransition>
            <SiteFooter />
          </div>
        </StoryblokProvider>
      </body>
    </html>
  );
}
