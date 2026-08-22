import type { Metadata, Viewport } from "next";
import { Inter, Jost } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { RenewBackground } from "@/components/environment/RenewBackground";
import { GlassFilter } from "@/components/ui/GlassFilter";
import { GlobalTapSound } from "@/components/ui/GlobalTapSound";
import { themeNoFlashScript } from "@/lib/theme";
import { publicEnv } from "@/lib/env";
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

const appUrl = publicEnv.appUrl;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Renew",
    template: "%s · Renew",
  },
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Renew",
    description:
      "A calm, premium personal finance companion. See what you have, where it's going, and what's coming next.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Renew",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfe7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#060a18" },
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme: set data-theme before hydration. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className={`${inter.variable} ${jost.variable} antialiased`}>
        <GlassFilter />
        <RenewBackground />
        <GlobalTapSound />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
