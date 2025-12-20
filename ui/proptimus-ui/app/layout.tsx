import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { config, Config } from "@/config";
import QueryProvider from "@/lib/providers/QueryProvider";
import { Toaster } from "@/components/common/Sonner";
import Script from "next/script";
import { Footer } from "@/components/layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: config.meta.title,
    template: `%s | ${config.app.name}`,
  },
  description: config.meta.description,
  keywords: config.meta.keywords,
  authors: [{ name: config.app.author }],
  creator: config.app.author,
  metadataBase: new URL(config.app.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: config.meta.openGraph.type,
    locale: config.meta.openGraph.locale,
    url: config.app.url,
    siteName: config.meta.openGraph.siteName,
    title: config.meta.openGraph.title,
    description: config.meta.openGraph.description,
    images: [
      {
        url: config.meta.openGraph.image,
        width: 1200,
        height: 630,
        alt: config.meta.openGraph.imageAlt,
      },
    ],
  },
  twitter: {
    card: config.meta.twitter.card,
    title: config.meta.twitter.title,
    description: config.meta.twitter.description,
    images: [
      {
        url: config.meta.twitter.image,
        alt: config.meta.twitter.imageAlt,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification IDs when available
    // google: "google-verification-id",
    // yandex: "yandex-verification-id",
    // yahoo: "yahoo-verification-id",
    // other: {
    //   me: ["contact@af2.example.com"],
    // },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.js"
          strategy="beforeInteractive"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <main>
            {children}
          </main>
          <Footer />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
