import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAStatus from "@/components/PWAStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pro-DJ - Professional DJ Booking Platform",
  description:
    "Book professional DJs for your events. Browse portfolios, listen to mixes, and secure your perfect DJ.",
  keywords: ["DJ", "booking", "music", "events", "entertainment", "mixes"],
  authors: [{ name: "Pro-DJ Team" }],
  creator: "Pro-DJ",
  publisher: "Pro-DJ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pro-DJ",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#7c3aed",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pro-dj.com",
    title: "Pro-DJ - Professional DJ Booking Platform",
    description:
      "Book professional DJs for your events. Browse portfolios, listen to mixes, and secure your perfect DJ.",
    siteName: "Pro-DJ",
    images: [
      {
        url: "/icons/icon-512x512.svg",
        width: 512,
        height: 512,
        alt: "Pro-DJ Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro-DJ - Professional DJ Booking Platform",
    description:
      "Book professional DJs for your events. Browse portfolios, listen to mixes, and secure your perfect DJ.",
    images: ["/icons/icon-512x512.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Pro-DJ" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pro-DJ" />
        <meta
          name="description"
          content="Book professional DJs for your events. Browse portfolios, listen to mixes, and secure your perfect DJ."
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#7c3aed" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link
          rel="icon"
          type="image/svg+xml"
          sizes="32x32"
          href="/icons/icon-32x32.svg"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          sizes="16x16"
          href="/icons/icon-16x16.svg"
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#7c3aed"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <Providers>
          <Navbar />
          {children}
          <Toaster position="top-right" />
          <PWAInstallPrompt />
          <PWAStatus />
        </Providers>
      </body>
    </html>
  );
}
