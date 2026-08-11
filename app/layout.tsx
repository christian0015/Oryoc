// app/layout.tsx
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ORYOC — Location longue duree de confiance au Maroc",
  description:
    "ORYOC est la plateforme de reference pour la location longue duree au Maroc : annonces verifiees, proprietaires notes, visites 360.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-ink text-paper antialiased">
        <Providers>
          <Nav />
          <main className="pb-28 md:pb-0">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
