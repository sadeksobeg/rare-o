import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Noto_Naskh_Arabic,
  Noto_Sans_Arabic,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { getRequestLocale } from "@/lib/i18n/server";
import { dirForLocale } from "@/lib/i18n/config";

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const latin = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const displayLat = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-lat",
  display: "swap",
});

const displayAr = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RARE OUD",
  description: "RARE OUD — curated string instruments and accessories",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const dir = dirForLocale(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${arabic.variable} ${latin.variable} ${displayLat.variable} ${displayAr.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
