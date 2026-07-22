import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pasteur.plus"),
  title: {
    default: "پاستور پلاس | درمانگاه پزشکی و دندانپزشکی",
    template: "%s | پاستور پلاس",
  },
  description:
    "درمانگاه پاستور پلاس — خدمات پزشکی، دندانپزشکی، نوبت‌دهی آنلاین و تجهیزات پزشکی.",
  applicationName: "پاستور پلاس",
  keywords: [
    "پاستور پلاس",
    "دندانپزشکی",
    "پزشکی",
    "نوبت‌دهی",
    "pasteur.plus",
  ],
  authors: [{ name: "Clinique Pasteur", url: "https://pasteur.plus" }],
  manifest: "/manifest.webmanifest",
  themeColor: "#0891b2",
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
