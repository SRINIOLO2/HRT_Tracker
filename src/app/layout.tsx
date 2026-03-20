import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#7c5cfc',
};

export const metadata: Metadata = {
  title: 'HRT Tracker — Hormone Health Tracker',
  description: 'A privacy-first, offline-capable health tracking app for hormone medication management. Track doses, blood tests, mood, and transition goals.',
  keywords: 'HRT, hormone tracking, medication tracker, health app, blood test tracker',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-512.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
