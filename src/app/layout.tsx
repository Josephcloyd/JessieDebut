import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Pinyon_Script, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/supabase/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-pinyon", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "The Grand Debut",
  description: "You are cordially invited to celebrate an evening to remember.",
};

export const viewport: Viewport = { themeColor: "#FFF9F4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${playfair.variable} ${manrope.variable} ${pinyon.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
