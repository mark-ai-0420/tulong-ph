import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TulongPH - Edukasyon at Scholarship',
  description: 'Mga scholarship, CHED, TES at LGU aid para sa pamilyang Pilipino.',
  alternates: { canonical: 'https://tulongph.vercel.app/edukasyon' },
  openGraph: {
    title: 'TulongPH - Edukasyon at Scholarship',
    description: 'Mga scholarship, CHED, TES at LGU aid para sa pamilyang Pilipino.',
    url: 'https://tulongph.vercel.app/edukasyon',
    siteName: 'TulongPH',
    locale: 'fil_PH',
    type: 'website',
    images: [{ url: '/og/edukasyon.png', width: 1200, height: 630, alt: 'TulongPH - Edukasyon at Scholarship' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TulongPH - Edukasyon at Scholarship',
    description: 'Mga scholarship, CHED, TES at LGU aid para sa pamilyang Pilipino.',
    images: ['/og/edukasyon.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
