import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Bike Fit Digital Twin',
  description:
    'Multi-tenant bike fitting platform: 3D holographic rider, interactive fit, size comparison, and AI fit coaching.',
};

export const viewport: Viewport = {
  themeColor: '#070b16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-slate-100 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
