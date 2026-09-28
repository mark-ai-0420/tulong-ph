import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "TulongPH - Philippine Government Medical & Crisis Assistance Navigator",
  description:
    "100% offline-ready, free civic tool helping Filipino families prepare, organize, and file for Malasakit Centers (RA 11463), PCSO MAP, DSWD AICS, and Senate Medical Assistance.",
  keywords: [
    "Malasakit Center",
    "DSWD AICS",
    "PCSO Medical Assistance",
    "PhilHealth Case Rates",
    "Hospital Bill Assistance",
    "Tulong Medikal",
    "Ayuda Pilipinas",
  ],
  authors: [{ name: "TulongPH Community" }],
  metadataBase: new URL("https://tulongph.vercel.app"),
  openGraph: {
    title: "TulongPH - Philippine Government Medical & Crisis Assistance Navigator",
    description:
      "Gabay sa Ayuda ng Gobyerno: I-triage ang hospital bill, i-print ang opisyal na Malasakit at DSWD forms, at hanapin ang 200+ hospital desks sa buong bansa. 100% libre at pribado.",
    url: "https://tulongph.vercel.app",
    siteName: "TulongPH",
    locale: "fil_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TulongPH - Philippine Government Medical & Crisis Assistance Navigator",
    description:
      "Gabay sa Ayuda ng Gobyerno: I-triage ang hospital bill, i-print ang opisyal na Malasakit at DSWD forms, at hanapin ang 200+ hospital desks.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
