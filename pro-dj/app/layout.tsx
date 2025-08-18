import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAStatus from "@/components/PWAStatus";
import PageLoading from "@/components/PageLoading";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pro-DJ - Professional DJ Booking Platform",
  description:
    "Book professional DJs for your events. Browse portfolios, listen to mixes, and secure your perfect DJ.",
  icons: {
    icon: [
      { url: "/icons/prodj_logo.png", type: "image/png" },
      { url: "/icons/prodj_logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/icons/prodj_logo.png",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pro-DJ",
  },
  formatDetection: {
    telephone: false,
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
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#8b5cf6" />

        <link rel="apple-touch-icon" href="/icons/prodj_logo.png" />
        <link rel="icon" type="image/x-icon" href="/icons/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#8b5cf6"
        />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <Providers>
          <ServiceWorkerRegistration />
          <Navbar />
          {children}
          <Toaster position="top-right" />
          <PWAInstallPrompt />
          <PWAStatus />
          <PageLoading />
        </Providers>
      </body>
    </html>
  );
}
