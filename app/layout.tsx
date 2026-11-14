/* eslint-disable @next/next/no-page-custom-font */
import type {Metadata} from 'next';
import './globals.css'; // Global styles

const siteDescription =
  'Aplicación de notas Markdown minimalista con sincronización en GitHub, IA multimodelo y cifrado de extremo a extremo. Parte del ecosistema wwwOS.';

export const metadata: Metadata = {
  metadataBase: new URL('https://webapp.microtecn.xyz'),
  title: {
    default: 'Webapp — wwwOS',
    template: '%s · Webapp',
  },
  description: siteDescription,
  applicationName: 'Webapp',
  authors: [{ name: 'wwweborg', url: 'https://github.com/wwweborg' }],
  creator: 'wwweborg',
  publisher: 'wwweborg',
  category: 'productivity',
  keywords: [
    'notas',
    'markdown',
    'GitHub',
    'IA',
    'inteligencia artificial',
    'privacidad',
    'cifrado',
    'wwwOS',
    'app de notas',
    'macOS',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    siteName: 'Webapp',
    title: 'Webapp — wwwOS',
    description: siteDescription,
  },
  twitter: {
    card: 'summary',
    title: 'Webapp — wwwOS',
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
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
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
