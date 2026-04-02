import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnchèreSolive - Back-Office",
  description:
    "Plateforme de gestion des enchères d'olives en Tunisie. Tableau de bord, gestion des utilisateurs, suivi des prix et bien plus.",
  keywords: [
    "EnchèreSolive",
    "olives",
    "enchères",
    "Tunisie",
    "agriculture",
    "back-office",
    "gestion",
    "prix",
  ],
  authors: [{ name: "EnchèreSolive" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "EnchèreSolive - Back-Office",
    description:
      "Plateforme de gestion des enchères d'olives en Tunisie.",
    siteName: "EnchèreSolive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EnchèreSolive - Back-Office",
    description:
      "Plateforme de gestion des enchères d'olives en Tunisie.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
