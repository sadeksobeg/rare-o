import type { Metadata } from "next";
import {
  Amiri,
  Cormorant_Garamond,
  IBM_Plex_Sans_Arabic,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { getRequestLocale } from "@/lib/i18n/server";
import { dirForLocale } from "@/lib/i18n/config";
import { MotionProvider } from "@/components/motion/provider";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400"],
  variable: "--font-amiri",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const source = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source",
  display: "swap",
});

const plexAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-ar",
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
      className={
        // Only the active locale's font variables are applied; unused vars
        // fall back via globals.css so the other locale's files never load.
        // -u-nu-latn: Western digits app-wide (PLAN D5 / design-lab port).
        locale === "ar"
          ? `${amiri.variable} ${plexAr.variable}`
          : `${cormorant.variable} ${source.variable}`
      }
      style={{ fontVariantNumeric: "lining-nums" }}
    >
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="ro-skip-link">
          {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
        </a>
        {process.env.RO_SKIP_MOTION_PROVIDER === "1" ? (
          children
        ) : (
          <MotionProvider>{children}</MotionProvider>
        )}
      </body>
    </html>
  );
}
