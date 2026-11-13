import type { Metadata, Viewport } from "next";
import { IdlePrivacyGuard } from "@/components/shared/IdlePrivacyGuard";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1E2D40",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "TulongPH - Kalusugan, Edukasyon at Manggagawa",
  description:
    "Free civic guide for health assistance, education scholarships, worker benefits and loans. Calculations and records stay on your device.",
  keywords: [
    "Malasakit Center",
    "DSWD AICS",
    "PCSO Medical Assistance",
    "PhilHealth Case Rates",
    "Hospital Bill Assistance",
    "Tulong Medikal",
    "Ayuda Pilipinas",
    "Education Scholarships",
    "SSS GSIS Pag-IBIG Worker Benefits",
  ],
  authors: [{ name: "TulongPH Community" }],
  metadataBase: new URL("https://tulongph.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "TulongPH - Kalusugan, Edukasyon at Manggagawa",
    description:
      "Gabay sa kalusugan, scholarship, benepisyo at karapatan sa trabaho. Kompyutasyon, checklist at direktoryo sa buong bansa. 100% libre at pribado.",
    url: "https://tulongph.vercel.app",
    siteName: "TulongPH",
    locale: "fil_PH",
    type: "website",
    images: [{ url: "/og/home.png", width: 1200, height: 630, alt: "TulongPH - Gabay sa Kalusugan at Ospital" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TulongPH - Kalusugan, Edukasyon at Manggagawa",
    description:
      "Gabay sa kalusugan, scholarship, benepisyo at karapatan sa trabaho. Kompyutasyon, checklist at direktoryo.",
    images: ["/og/home.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fil-PH" className="h-full antialiased">
      <body className="min-h-full flex flex-col tabular-nums">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "TulongPH",
            url: "https://tulongph.vercel.app",
            description: "An independent, free civic utility for Philippine assistance guidance. Non-government; records stay on your device.",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            isAccessibleForFree: true,
          }) }}
        />
        {children}
        <IdlePrivacyGuard />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
