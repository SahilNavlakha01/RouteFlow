import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'RouteFlow — Smart Hyperlocal Route Ledger & Micro-ERP',
  description: 'Fast daily collection, customer ledger & WhatsApp billing for Laundry, Tiffins, Grocery & local services.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RouteFlow',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-stone-950 text-stone-100 min-h-screen selection:bg-amber-500/20 selection:text-amber-200">
        <LanguageProvider>
          <AuthProvider>
            <ServiceWorkerRegister />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
