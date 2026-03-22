import type { Metadata } from "next";
import StoryblokProvider from "@/components/StoryblokProvider";
import SiteHeader from "@/components/sections/SiteHeader/SiteHeader";
import SiteFooter from "@/components/sections/SiteFooter/SiteFooter";
import PageTransition from "@/components/layout/PageTransition/PageTransition";
import "@/styles/globals.css";

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
      <body suppressHydrationWarning>
        <StoryblokProvider>
          <SiteHeader />
          <PageTransition variant="diagonalWipe">
            {children}
          </PageTransition>
          <SiteFooter />
        </StoryblokProvider>
      </body>
    </html>
  );
}
