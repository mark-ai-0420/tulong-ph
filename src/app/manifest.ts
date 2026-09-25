import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TulongPH - Philippine Government Medical Assistance Navigator',
    short_name: 'TulongPH',
    description: 'Gabay sa Malasakit Centers, PCSO MAP, DSWD AICS, at Tulong Medikal sa Buong Pilipinas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F5',
    theme_color: '#1e3a8a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
