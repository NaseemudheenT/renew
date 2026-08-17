import type { Metadata, Viewport } from "next";
import { Inter, Jost } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { RenewBackground } from "@/components/environment/RenewBackground";
import { GlassFilter } from "@/components/ui/GlassFilter";
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
    default: "Renew — Never forget what matters",
    template: "%s · Renew",
  },
  description:
    "Renew is a calm, premium companion that makes sure you never lose money, documents, or peace of mind by forgetting a renewal — passports, insurance, licenses, subscriptions, bills and more.",
  applicationName: "Renew",
  keywords: [
    "reminders",
    "renewals",
    "document expiry",
    "insurance",
    "passport",
    "subscriptions",
  ],
  authors: [{ name: publicEnv.parentCompany }],
  openGraph: {
    type: "website",
    siteName: "Renew",
    title: "Renew — Never forget what matters",
    description:
      "A calm, premium companion for life's renewals and commitments.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Renew — Never forget what matters",
    description:
      "A calm, premium companion for life's renewals and commitments.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    title: "Renew",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede2ca" },
    { media: "(prefers-color-scheme: dark)", color: "#17130a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
