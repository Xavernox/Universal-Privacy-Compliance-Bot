import type { Metadata } from 'next';

const siteConfig = {
  name: 'U-PCB',
  description:
    'Unified Platform for Cloud-based Policy and Compliance. Secure your cloud infrastructure with intelligent scanning, policy management, and real-time alerts.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://upcb.dev',
  ogImage: 'https://upcb.dev/og-image.png',
  links: {
    twitter: 'https://twitter.com/upcbdev',
    github: 'https://github.com/upcbdev',
  },
};

export function createMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} - ${siteConfig.description}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
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
        url: siteConfig.url,
      },
    ],
    creator: 'U-PCB Team',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: `${siteConfig.name} - Unified Cloud Security Platform`,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - Unified Cloud Security Platform`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteConfig.name} - Unified Cloud Security Platform`,
      description: siteConfig.description,
      creator: '@upcbdev',
      images: [siteConfig.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    ...overrides,
  };
}

export const siteConfiguration = siteConfig;
