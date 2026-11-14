/* eslint-disable @next/next/no-page-custom-font */
import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import {
  ALLOW_INDEXING,
  GITHUB_ORG_URL,
  GITHUB_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@/lib/site';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'ProductivityApplication',
  applicationSubCategory: 'Note-taking',
  operatingSystem: 'Web',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  codeRepository: GITHUB_URL,
  downloadUrl: GITHUB_URL,
  license: 'https://opensource.org/licenses/MIT',
  isAccessibleForFree: true,
  inLanguage: ['es', 'en', 'pt', 'fr', 'nl', 'it', 'de', 'ja', 'zh', 'ru'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Organization',
    name: 'wwweborg',
    url: GITHUB_ORG_URL,
  },
  sameAs: [GITHUB_URL, GITHUB_ORG_URL],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{name: 'wwweborg', url: GITHUB_ORG_URL}],
  creator: 'wwweborg',
  publisher: 'wwweborg',
  category: 'productivity',
  keywords: [
    'notas',
    'markdown',
    'app de notas',
    'notas markdown',
    'GitHub',
    'sincronización',
    'IA',
    'inteligencia artificial',
    'privacidad',
    'cifrado',
    'E2EE',
    'código abierto',
    'open source',
    'markdown notes',
    'note-taking app',
    'self-hosted',
    'wwwOS',
    'macOS',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      {url: '/icon.svg', type: 'image/svg+xml'},
      {url: '/favicon.svg', type: 'image/svg+xml'},
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    alternateLocale: ['en_US'],
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: ALLOW_INDEXING,
    follow: ALLOW_INDEXING,
    googleBot: {
      index: ALLOW_INDEXING,
      follow: ALLOW_INDEXING,
      'max-image-preview': ALLOW_INDEXING ? 'large' : 'none',
      'max-snippet': ALLOW_INDEXING ? -1 : 0,
      'max-video-preview': ALLOW_INDEXING ? -1 : 0,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#F8FAFC'},
    {media: '(prefers-color-scheme: dark)', color: '#0B1220'},
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="alternate icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
