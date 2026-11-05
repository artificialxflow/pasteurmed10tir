import type { Metadata, Viewport } from "next";
import { CaptureReferralRef } from "@/components/commerce/CaptureReferralRef";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#5856D6",
};

const BRAND_CACHE = "?v=20261105";

export const metadata: Metadata = {
  metadataBase: new URL("https://pasteur.plus"),
  title: {
    default: "پاستور پلاس | درمانگاه پزشکی و دندانپزشکی",
    template: "%s | پاستور پلاس",
  },
  description:
    "درمانگاه پاستور پلاس — خدمات پزشکی، دندانپزشکی، نوبت‌دهی آنلاین و تجهیزات پزشکی.",
  verification: {
    google: "MwR_rw-YftFdG8DuFEsb5pHqw3zJOmlbROkGfI2ByWE",
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: "پاستور پلاس | درمانگاه پزشکی و دندانپزشکی",
    description:
      "خدمات پزشکی، دندانپزشکی و نوبت‌دهی آنلاین در پاستور پلاس.",
    images: [`/brand/pasteur-plus-logo.jpg${BRAND_CACHE}`],
  },
  applicationName: "پاستور پلاس",
  keywords: [
    "پاستور پلاس",
    "دندانپزشکی",
    "پزشکی",
    "نوبت‌دهی",
    "pasteur.plus",
  ],
  authors: [{ name: "پاستور پلاس", url: "https://pasteur.plus" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: `/icon.svg${BRAND_CACHE}`, type: "image/svg+xml" },
      { url: `/logo.jpg${BRAND_CACHE}`, type: "image/jpeg" },
    ],
    apple: [{ url: `/icon-192.jpg${BRAND_CACHE}`, type: "image/jpeg", sizes: "192x192" }],
    shortcut: [`/icon.svg${BRAND_CACHE}`],
  },
  other: {
    enamad: "10209334",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://pasteur.plus",
    siteName: "پاستور پلاس",
    title: "پاستور پلاس | درمانگاه پزشکی و دندانپزشکی",
    description:
      "خدمات پزشکی، دندانپزشکی و نوبت‌دهی آنلاین در پاستور پلاس.",
    images: [{ url: `/brand/pasteur-plus-logo.jpg${BRAND_CACHE}`, alt: "پاستور پلاس" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <CaptureReferralRef />
        {children}
      </body>
    </html>
  );
}
