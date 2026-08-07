import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { themeInitScript } from "@/components/providers/theme-provider";
import { clientEnv } from "@/lib/env";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.appUrl),
  title: {
    default: "Renew — Never forget what matters",
    template: "%s · Renew",
  },
  description:
    "Renew is a calm, premium life companion that makes sure you never lose money, opportunities, or peace of mind because you forgot something important.",
  applicationName: "Renew",
  authors: [{ name: "Zap" }],
  keywords: ["reminders", "renewals", "documents", "subscriptions", "expiry", "peace of mind"],
  openGraph: {
    title: "Renew — Never forget what matters",
    description:
      "A calm, premium companion for life's important renewals and reminders.",
    siteName: "Renew",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        {/* Set the theme before first paint to avoid any flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
