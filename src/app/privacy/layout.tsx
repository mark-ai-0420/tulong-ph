import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TulongPH - Privacy at Data Safety',
  description: '100% pribado sa device mo. Walang account, walang server storage. Independent civic guide, non-government.',
  alternates: { canonical: 'https://tulongph.vercel.app/privacy' },
  openGraph: {
    title: 'TulongPH - Privacy at Data Safety',
    description: '100% pribado sa device mo. Walang account, walang server storage. Independent civic guide, non-government.',
    url: 'https://tulongph.vercel.app/privacy',
    siteName: 'TulongPH',
    locale: 'fil_PH',
    type: 'website',
    images: [{ url: '/og/privacy.png', width: 1200, height: 630, alt: 'TulongPH - Privacy at Data Safety' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TulongPH - Privacy at Data Safety',
    description: '100% pribado sa device mo. Walang account, walang server storage. Independent civic guide, non-government.',
    images: ['/og/privacy.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
