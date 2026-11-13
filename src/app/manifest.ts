import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TulongPH - Philippine Government Medical Assistance Navigator',
    short_name: 'TulongPH',
    description: 'Gabay sa Malasakit Centers, PCSO MAP, DSWD AICS, at Tulong Medikal sa Buong Pilipinas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F5',
    theme_color: '#1E2D40',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
