import type { Metadata } from 'next';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cultural Marketplace · Agusan del Sur Indigenous Crafts & Living Heritage',
  description: 'Authentic indigenous crafts, traditional weaves, and hands-on cultural workshops directly from Agusan del Sur master artisans.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-canvas text-charcoal-900 selection:bg-ochre-100 selection:text-ochre-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
