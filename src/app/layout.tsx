import type { Metadata, Viewport } from "next";
import { Inter, Jost, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { RenewBackground } from "@/components/environment/RenewBackground";
import { GlassFilter } from "@/components/ui/GlassFilter";
import { themeNoFlashScript } from "@/lib/theme";
import { a11yNoFlashScript } from "@/lib/a11y";
import { publicEnv } from "@/lib/env";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

// Instrument-panel display face — geometric technical sans with tabular figures
// for numbers, balances and headlines (Financial OS design spec §1).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const appUrl = publicEnv.appUrl;

const googleVerification = (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "").trim();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Renew",
    template: "%s · Renew",
  },
  alternates: { canonical: "/" },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  description:
    "Renew is a calm, premium personal finance companion — see what you have, where it's going, and what's coming next. Accounts, transactions, budgets, savings, investments, bills and subscriptions in one private place.",
  applicationName: "Renew",
  keywords: [
    "personal finance",
    "budgeting",
    "money tracker",
    "savings",
    "investments",
    "subscriptions",
    "expense tracker",
  ],
  authors: [{ name: "Renew" }],
  creator: "Renew",
  publisher: "Renew",
  openGraph: {
    type: "website",
    siteName: "Renew",
    title: "Renew",
    description:
      "A calm, premium personal finance companion. See what you have, where it's going, and what's coming next.",
    url: appUrl,
    images: [{ url: BRAND.ogImage, width: 1200, height: 630, alt: BRAND.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Renew",
    description:
      "A calm, premium personal finance companion. See what you have, where it's going, and what's coming next.",
    images: [BRAND.ogImage],
  },
  icons: {
    // The official gold Renew logo, as the icon everywhere (browser tab,
    // install, home screen). Paths come from the brand source of truth (§79).
    icon: [
      { url: BRAND.icons.favicon32, sizes: "32x32", type: "image/png" },
      { url: BRAND.icons.icon192, sizes: "192x192", type: "image/png" },
      { url: BRAND.icons.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: BRAND.icons.appleTouch, sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Renew",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f4" },
    { media: "(prefers-color-scheme: dark)", color: "#05070a" },
  ],
  width: "device-width",
  initialScale: 1,
  // A fixed, app-like page: no pinch-zoom, no double-tap zoom, and the layout
  // resizes to sit above the on-screen keyboard instead of being covered by it.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

// Structured data so Google can show Renew as a rich result — name, logo,
// domain and what it is. No ratings are declared (there are no real reviews to
// cite yet — we never fabricate them).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${appUrl}/#org`,
      name: "Renew",
      url: appUrl,
      logo: `${appUrl}/icon-512.png`,
      description: "A calm, premium personal finance companion.",
    },
    {
      "@type": "WebSite",
      "@id": `${appUrl}/#website`,
      name: "Renew",
      url: appUrl,
      publisher: { "@id": `${appUrl}/#org` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Renew",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, iOS, Android",
      url: appUrl,
      description:
        "See what you have, where it's going, and what's coming next — accounts, budgets, savings, bills and subscriptions, with Ren, your finance assistant.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme + accessibility prefs: set on <html> before hydration. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
        <script dangerouslySetInnerHTML={{ __html: a11yNoFlashScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${inter.variable} ${jost.variable} ${spaceGrotesk.variable} antialiased`}>
        <GlassFilter />
        <RenewBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
