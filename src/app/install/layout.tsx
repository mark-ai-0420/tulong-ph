import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TulongPH - I-install ang Offline App',
  description: 'I-save sa telepono. Gumagana kahit mahina ang signal sa ospital pagkatapos ma-load ang app.',
  alternates: { canonical: 'https://tulongph.vercel.app/install' },
  openGraph: {
    title: 'TulongPH - I-install ang Offline App',
    description: 'I-save sa telepono. Gumagana kahit mahina ang signal sa ospital pagkatapos ma-load ang app.',
    url: 'https://tulongph.vercel.app/install',
    siteName: 'TulongPH',
    locale: 'fil_PH',
    type: 'website',
    images: [{ url: '/og/install.png', width: 1200, height: 630, alt: 'TulongPH - I-install ang Offline App' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TulongPH - I-install ang Offline App',
    description: 'I-save sa telepono. Gumagana kahit mahina ang signal sa ospital pagkatapos ma-load ang app.',
    images: ['/og/install.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
