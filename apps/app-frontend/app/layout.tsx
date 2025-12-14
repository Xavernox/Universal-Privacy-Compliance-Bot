import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QueryProvider } from '@/lib/providers';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://upcb.dev'),
  title: {
    default: 'U-PCB - Unified Cloud Security Platform',
    template: '%s | U-PCB',
  },
  description:
    'Unified Platform for Cloud-based Policy and Compliance. Secure your cloud infrastructure with intelligent scanning, policy management, and real-time alerts.',
  keywords: [
    'cloud security',
    'policy management',
    'compliance',
    'cloud scanning',
    'security platform',
  ],
  authors: [
    {
      name: 'U-PCB Team',
      url: 'https://upcb.dev',
    },
  ],
  creator: 'U-PCB Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://upcb.dev',
    siteName: 'U-PCB',
    title: 'U-PCB - Unified Cloud Security Platform',
    description:
      'Unified Platform for Cloud-based Policy and Compliance. Secure your cloud infrastructure with intelligent scanning, policy management, and real-time alerts.',
    images: [
      {
        url: 'https://upcb.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'U-PCB - Unified Cloud Security Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'U-PCB - Unified Cloud Security Platform',
    description:
      'Unified Platform for Cloud-based Policy and Compliance. Secure your cloud infrastructure with intelligent scanning, policy management, and real-time alerts.',
    creator: '@upcbdev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <QueryProvider>
          <Header />
          <main className="flex-1 w-full container-base py-8 md:py-12">
            {children}
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
