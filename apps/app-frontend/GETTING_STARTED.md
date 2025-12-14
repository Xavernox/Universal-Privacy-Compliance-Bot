# Getting Started with U-PCB App Frontend

Welcome to the U-PCB App Frontend! This guide will help you get up and running quickly.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- A code editor (VS Code recommended)

You can check your versions with:
```bash
node --version
npm --version
```

## Initial Setup

### 1. Installation

From the project root directory, install all dependencies:

```bash
npm install
```

This will install dependencies for all workspaces including the app-frontend.

### 2. Environment Setup

Create a `.env.local` file in the `apps/app-frontend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

> **Note**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put sensitive data (API keys, tokens) in these variables.

## Development

### Start the Development Server

```bash
# From the app-frontend directory
npm run dev

# Or from the project root
npm run dev --workspace=apps/app-frontend
```

The application will be available at `http://localhost:3000`.

### Available Development Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Start production server (after build)
npm run start
```

## Project Structure

```
app-frontend/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── sitemap.ts              # Dynamic sitemap for SEO
│   ├── robots.ts               # robots.txt configuration
│   └── components/             # Demo component pages
│       └── page.tsx            # Component showcase
├── components/
│   ├── Header.tsx              # Navigation header
│   ├── Footer.tsx              # Footer component
│   └── ui/                     # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── ... (other components)
│       └── index.ts            # Component exports
├── lib/
│   ├── metadata.ts             # SEO metadata utilities
│   ├── providers.tsx           # React Query provider
│   ├── hooks.ts                # Data fetching hooks
│   ├── utils.ts                # Utility functions
│   ├── validation.ts           # Form validation
│   └── constants.ts            # App constants
├── types/
│   └── index.ts                # TypeScript type definitions
├── tailwind.config.ts          # Tailwind theme configuration
├── postcss.config.js           # PostCSS plugins
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project README
```

## Key Features

### 1. UI Components

Pre-built, reusable components ready to use:

```tsx
import { Button, Card, Input, Badge } from '@/components/ui';

export default function Example() {
  return (
    <Card>
      <Input label="Email" type="email" />
      <Button variant="primary">Submit</Button>
      <Badge variant="success">Success</Badge>
    </Card>
  );
}
```

See `app/components/page.tsx` for a complete showcase of all components.

### 2. Data Fetching

Use React Query hooks for data management:

```tsx
'use client';

import { useFetchData } from '@/lib/hooks';
import { LoadingSpinner, Card } from '@/components/ui';

export default function MyPage() {
  const { data, isLoading, error } = useFetchData(
    ['scans'],
    '/scans'
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      {data?.map(item => (
        <Card key={item.id}>{item.name}</Card>
      ))}
    </div>
  );
}
```

### 3. Dark Mode

Dark mode is automatically supported. Toggle is in the header. Theme preference persists in localStorage.

```tsx
// Dark mode is handled by Tailwind's dark: prefix
className="bg-white dark:bg-neutral-900"
className="text-neutral-900 dark:text-neutral-50"
```

### 4. Form Validation

Built-in form validation utilities:

```tsx
import { validateForm, validateEmail } from '@/lib/validation';

const errors = validateForm(
  { email: 'test@example.com', password: 'short' },
  {
    email: { required: true, email: true },
    password: { minLength: { value: 8, message: 'Too short' } },
  }
);
```

### 5. SEO Optimization

Metadata is configured in the root layout and can be customized per page:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Page Title',
  description: 'Page description for search engines',
  openGraph: {
    title: 'My Page Title',
    description: 'Page description',
    images: [{ url: '/og-image.png' }],
  },
};

export default function Page() {
  return <div>Page content</div>;
}
```

## Common Tasks

### Adding a New Page

Create a new file in the `app` directory:

```tsx
// app/new-page/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Page',
  description: 'Page description',
};

export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  );
}
```

The page will be accessible at `/new-page`.

### Creating a New Component

Create a new file in the `components` directory:

```tsx
// components/MyComponent.tsx
import clsx from 'clsx';

interface MyComponentProps {
  title: string;
  variant?: 'default' | 'primary';
}

export function MyComponent({ title, variant = 'default' }: MyComponentProps) {
  return (
    <div className={clsx(
      'p-4 rounded-lg',
      variant === 'primary' && 'bg-primary-100 dark:bg-primary-900'
    )}>
      {title}
    </div>
  );
}
```

### Using Form Components

```tsx
'use client';

import { useState } from 'react';
import { Input, Textarea, Button } from '@/components/ui';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Textarea
        label="Message"
        name="message"
        value={formData.message}
        onChange={handleChange}
        rows={5}
      />
      <Button type="submit" variant="primary">
        Send
      </Button>
    </form>
  );
}
```

## Styling

### Tailwind CSS

Tailwind is fully configured. Use utility classes for styling:

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold">Title</h2>
  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
    Action
  </button>
</div>
```

### Custom Styles

For component-specific styles, create CSS files:

```css
/* components/MyComponent.css */
.my-component {
  @apply p-4 rounded-lg bg-white dark:bg-neutral-900;
}

.my-component:hover {
  @apply shadow-lg transition-all;
}
```

### CSS Modules (Optional)

Next.js supports CSS Modules:

```tsx
// components/MyComponent.tsx
import styles from './MyComponent.module.css';

export function MyComponent() {
  return <div className={styles.container}>Content</div>;
}
```

```css
/* components/MyComponent.module.css */
.container {
  @apply p-4 rounded-lg;
}
```

## Debugging

### Browser DevTools

- Press `F12` or `Right-click → Inspect` to open DevTools
- Use the React DevTools extension for component debugging
- Network tab shows all API requests

### Next.js Debug Mode

Start development with source maps for better debugging:

```bash
npm run dev
```

The source maps are automatically configured.

### Console Logging

```tsx
'use client';

import { useEffect } from 'react';

export default function MyComponent() {
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);

  return <div>Content</div>;
}
```

## Performance Tips

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Next.js automatically splits code
3. **Lazy Loading**: Use React.lazy for heavy components
4. **React Query**: Caching is configured with sensible defaults
5. **CSS**: Only use Tailwind classes (no unused CSS in production)

## Common Issues

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

### Module Not Found Errors

Ensure path aliases in `tsconfig.json` match your imports:

```tsx
// ✅ Correct
import { Button } from '@/components/ui';

// ❌ Wrong (relative path when alias exists)
import { Button } from '../../../components/ui';
```

### Hot Reload Not Working

- Restart the development server
- Clear `.next` folder and rebuild

### TypeScript Errors

Run type checking:

```bash
npm run typecheck
```

Fix any reported errors before committing.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically build and deploy

### Docker

Build a Docker image:

```bash
docker build -f Dockerfile.nextjs -t app-frontend:latest .
docker run -p 3000:3000 app-frontend:latest
```

### Manual Deploy

Build and run:

```bash
npm run build
npm run start
```

## Environment Variables for Deployment

Set these in your hosting platform:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## Next Steps

1. ✅ **Explore Components**: Visit `/components` to see all available UI components
2. ✅ **Create a Page**: Add your first page using the directory structure
3. ✅ **Fetch Data**: Integrate with the API using the hooks in `lib/hooks.ts`
4. ✅ **Style**: Use Tailwind for responsive, accessible designs
5. ✅ **Deploy**: Get your app live on Vercel or your preferred host

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

## Getting Help

- Check the [README.md](README.md) for project overview
- Review [THEME.md](THEME.md) for design system details
- Look at existing components in `components/ui` for patterns
- Check the component showcase at `/components`

## Best Practices

1. **Type Everything**: Use TypeScript for better developer experience
2. **Use Components**: Build with reusable components
3. **Follow Conventions**: Use the existing patterns and structure
4. **Test in Dark Mode**: Test all components in both light and dark modes
5. **Mobile First**: Design for mobile, then enhance for larger screens
6. **Accessibility**: Always consider accessibility when building
7. **Performance**: Monitor bundle size and runtime performance
8. **SEO**: Add proper metadata to pages

Happy coding! 🚀
