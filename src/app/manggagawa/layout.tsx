import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TulongPH - Manggagawa at Benepisyo',
  description: 'SSS, Pag-IBIG, DOLE at OFW assistance calculator at gabay.',
  alternates: { canonical: 'https://tulongph.vercel.app/manggagawa' },
  openGraph: {
    title: 'TulongPH - Manggagawa at Benepisyo',
    description: 'SSS, Pag-IBIG, DOLE at OFW assistance calculator at gabay.',
    url: 'https://tulongph.vercel.app/manggagawa',
    siteName: 'TulongPH',
    locale: 'fil_PH',
    type: 'website',
    images: [{ url: '/og/manggagawa.png', width: 1200, height: 630, alt: 'TulongPH - Manggagawa at Benepisyo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TulongPH - Manggagawa at Benepisyo',
    description: 'SSS, Pag-IBIG, DOLE at OFW assistance calculator at gabay.',
    images: ['/og/manggagawa.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
