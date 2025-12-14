# U-PCB App Frontend

A modern, fully-featured Next.js 14 application with App Router, TypeScript, Tailwind CSS, and a comprehensive UI kit.

## Features

- **Next.js 14 App Router**: Latest React and Next.js features
- **TypeScript**: Strict type safety
- **Tailwind CSS**: Trust-first design palette with dark mode support
- **Comprehensive UI Kit**: Pre-built components for rapid development
  - Button, Card, Input, Textarea, Select
  - Table, Modal, Badge, Skeleton, LoadingSpinner
  - Full dark mode and accessibility support
- **SEO Optimized**: Metadata, sitemap, robots.txt
- **React Query**: Data fetching and caching
- **Modern Stack**: Best practices for performance and DX

## Project Structure

```
app-frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles and Tailwind directives
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt configuration
├── components/
│   ├── Header.tsx          # Navigation header with dark mode toggle
│   ├── Footer.tsx          # Footer with links
│   └── ui/                 # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Textarea.tsx
│       ├── Select.tsx
│       ├── Table.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       ├── LoadingSpinner.tsx
│       └── index.ts
├── lib/
│   ├── metadata.ts         # SEO metadata utilities
│   ├── providers.tsx       # React Query provider
│   └── hooks.ts            # Data fetching hooks
├── types/                  # TypeScript type definitions
├── tailwind.config.ts      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.js          # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# From the root of the monorepo
npm install

# Or install dependencies for just this workspace
npm install --workspace=apps/app-frontend
```

### Development

```bash
# Start the development server
npm run dev --workspace=apps/app-frontend

# Or from the root
npm run dev

# The app will be available at http://localhost:3000
```

### Building

```bash
# Build for production
npm run build --workspace=apps/app-frontend

# Start production server
npm run start --workspace=apps/app-frontend
```

### Type Checking

```bash
npm run typecheck --workspace=apps/app-frontend
```

### Linting

```bash
npm run lint --workspace=apps/app-frontend
```

## Tailwind Configuration

The Tailwind configuration includes:

- **Trust-first Color Palette**: Deep blues (primary), greens (secondary), and grays (neutral)
- **Semantic Colors**: Success, warning, error, and info states
- **Dark Mode**: Full dark mode support with `dark:` utility classes
- **Responsive Design**: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
- **Custom Typography**: Inter font with consistent sizing and spacing

### Color Usage

```tsx
// Primary colors (blues)
className="bg-primary-600 dark:bg-primary-700"

// Secondary colors (greens)
className="text-secondary-600 dark:text-secondary-400"

// Semantic colors
className="bg-success-100 text-success-800"
className="bg-error-100 text-error-800"
className="bg-warning-100 text-warning-800"
className="bg-info-100 text-info-800"
```

## UI Components

All components are located in `components/ui/` and exported from `components/ui/index.ts`.

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Click me
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Form Inputs

```tsx
import { Input, Textarea, Select } from '@/components/ui';

<Input label="Email" error="Invalid email" />
<Textarea label="Message" />
<Select options={options} />
```

### Table

```tsx
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui';

<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Name</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Data Fetching

Use the provided hooks from `lib/hooks.ts`:

```tsx
import { useFetchData, useCreateData } from '@/lib/hooks';

// Fetching data
const { data, isLoading } = useFetchData(
  ['scans'],
  '/scans'
);

// Creating data
const { mutate } = useCreateData('/scans');
mutate({ name: 'New Scan' });
```

## Environment Variables

Create a `.env.local` file in the app-frontend directory:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## SEO

- Metadata is configured in `app/layout.tsx` with OpenGraph and Twitter cards
- Dynamic sitemap is generated in `app/sitemap.ts`
- Robots.txt is configured in `app/robots.ts`
- Use the `createMetadata` helper from `lib/metadata.ts` for page-specific metadata

## Dark Mode

Dark mode toggle is built into the Header component. The theme is applied to the `html` element using the `dark` class.

```tsx
// In any component
document.documentElement.classList.add('dark');
document.documentElement.classList.remove('dark');
```

## Contributing

- Follow the existing code style and patterns
- Use TypeScript for type safety
- Test components in both light and dark modes
- Update the README if you add new features

## License

This project is part of the U-PCB platform. See the root LICENSE file for details.
