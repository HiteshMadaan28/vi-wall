import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, GA_MEASUREMENT_ID } from "@/lib/config";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

// Fonts are loaded via a plain stylesheet link in <head> (below) rather than
// next/font, which fetches at build time and can crash the build on hosted CI.
// The families are wired to CSS variables in globals.css.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The VI Wall – Build a Global Gaming Monument",
    template: "%s · The VI Wall",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["VI Wall", "gaming", "country leaderboard", "global monument", "players"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "The VI Wall – Build a Global Gaming Monument",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "The VI Wall – Build a Global Gaming Monument",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: "#070311",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router loads these site-wide via the root layout head. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="vi-backdrop min-h-screen">
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });`}
            </Script>
          </>
        )}
        <SiteNav />
        <main className="relative">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
