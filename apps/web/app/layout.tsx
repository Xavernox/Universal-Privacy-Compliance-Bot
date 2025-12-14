import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'U-PCB MVP - Unified Cloud Security Platform',
  description: 'Cloud security policy compliance and monitoring dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
