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

const SITE_URL = "https://oryoc.vercel.app"; // ⚠️ remplace par ton vrai domaine de prod

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ORYOC | Appartements & Villas à louer au Maroc – Casablanca, Rabat, Marrakech",
    template: "%s | ORYOC",
  },
  description:
    "Trouvez un appartement, une villa ou un studio à louer au Maroc : annonces vérifiées, propriétaires notés, visites virtuelles 360°. Casablanca, Rabat, Marrakech et plus.",
  keywords: [
    "appartement à louer Maroc",
    "location appartement Casablanca",
    "villa à louer Rabat",
    "studio à louer Marrakech",
    "location longue durée Maroc",
    "immobilier Maroc",
    "location sans agence Maroc",
  ],
  authors: [{ name: "ORYOC" }],
  creator: "ORYOC",
  publisher: "ORYOC",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: SITE_URL,
    siteName: "ORYOC",
    title: "ORYOC | Appartements & Villas à louer au Maroc",
    description:
      "Annonces vérifiées, propriétaires notés, visites virtuelles 360°. Trouvez votre location au Maroc en toute confiance.",
    images: [
      {
        url: "/opengraph-image.png", // 1200x630
        width: 1200,
        height: 630,
        alt: "ORYOC – Location immobilière au Maroc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ORYOC | Appartements & Villas à louer au Maroc",
    description:
      "Annonces vérifiées, propriétaires notés, visites virtuelles 360°.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  verification: {
    google: "dKt8mHbbvvZzsXGkW9k8pZALuGId_GhmM_obYLt6WM8", // uniquement si tu as un vrai code Search Console
  },
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