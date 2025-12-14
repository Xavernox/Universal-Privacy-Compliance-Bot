# Tailwind Theme Configuration

This document describes the custom Tailwind CSS theme configuration for the U-PCB App Frontend.

## Color Palette

### Primary Colors (Deep Blues)
The primary color palette uses deep, trust-inspiring blues perfect for a security platform.

- `primary-50`: #f0f5fa (lightest)
- `primary-100`: #dce6f5
- `primary-200`: #b8ceea
- `primary-300`: #8fb5df
- `primary-400`: #679cd4
- `primary-500`: #4682c8
- `primary-600`: #3a6db8 (primary brand color)
- `primary-700`: #2d569a
- `primary-800`: #243f7a
- `primary-900`: #1a2d5a
- `primary-950`: #0f1a3a (darkest)

**Usage:**
```tsx
// Background
className="bg-primary-600"

// Text
className="text-primary-600 dark:text-primary-400"

// Hover states
className="hover:bg-primary-700"
```

### Secondary Colors (Deep Greens)
Secondary colors use greens for trust and growth, complementing the primary blues.

- `secondary-50`: #f0f7f4
- `secondary-100`: #dceee8
- `secondary-200`: #b8ddd0
- `secondary-300`: #8fcbb8
- `secondary-400`: #679c9d
- `secondary-500`: #4a8b86
- `secondary-600`: #3d7673 (secondary brand color)
- `secondary-700`: #305f5d
- `secondary-800`: #26474a
- `secondary-900`: #1a3237
- `secondary-950`: #0f1c1e

**Usage:**
```tsx
className="bg-secondary-600 dark:bg-secondary-700"
className="text-secondary-600 dark:text-secondary-400"
```

### Neutral Colors (Grays)
Neutral grays for text, backgrounds, and borders. Carefully chosen to work in both light and dark modes.

- `neutral-50`: #f8f9fa
- `neutral-100`: #f1f3f5
- `neutral-200`: #e9ecef
- `neutral-300`: #dee2e6
- `neutral-400`: #ced4da
- `neutral-500`: #adb5bd
- `neutral-600`: #868e96
- `neutral-700`: #495057
- `neutral-800`: #343a40
- `neutral-900`: #212529
- `neutral-950`: #0f1117 (darkest, for dark mode backgrounds)

**Usage:**
```tsx
// Light mode background
className="bg-white dark:bg-neutral-900"

// Text colors
className="text-neutral-700 dark:text-neutral-300"

// Borders
className="border-neutral-200 dark:border-neutral-800"
```

### Semantic Colors

#### Success (Green)
For positive actions, confirmations, and successful states.
- `success-50`: #f0fdf4
- `success-100`: #dcfce7
- `success-500`: #22c55e
- `success-600`: #16a34a
- `success-700`: #15803d

```tsx
<Badge variant="success">Active</Badge>
className="text-success-600 dark:text-success-400"
```

#### Warning (Amber)
For caution states, warnings, and pending actions.
- `warning-50`: #fffbeb
- `warning-100`: #fef3c7
- `warning-500`: #f59e0b
- `warning-600`: #d97706
- `warning-700`: #b45309

```tsx
<Badge variant="warning">Pending</Badge>
className="bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-100"
```

#### Error/Danger (Red)
For errors, failures, and destructive actions.
- `error-50`: #fef2f2
- `error-100`: #fee2e2
- `error-500`: #ef4444
- `error-600`: #dc2626
- `error-700`: #b91c1c

```tsx
<Button variant="danger">Delete</Button>
<Badge variant="error">Error</Badge>
```

#### Info (Blue)
For informational messages and secondary actions.
- `info-50`: #f0f9ff
- `info-100`: #e0f2fe
- `info-500`: #0ea5e9
- `info-600`: #0284c7
- `info-700`: #0369a1

```tsx
<Badge variant="info">Information</Badge>
```

## Font System

### Font Families
- **Sans (default)**: Inter - A highly legible geometric sans-serif
- **Display**: Geist Sans/Mono - Modern, clean typeface family

```tsx
// Default font (applied globally)
className="font-sans"

// Display font (for headings)
className="font-display font-bold"
```

### Typography Scale

All font sizes follow a consistent scale with matching line heights:

- `text-xs`: 0.75rem / 1rem
- `text-sm`: 0.875rem / 1.25rem
- `text-base`: 1rem / 1.5rem (default)
- `text-lg`: 1.125rem / 1.75rem
- `text-xl`: 1.25rem / 1.75rem
- `text-2xl`: 1.5rem / 2rem
- `text-3xl`: 1.875rem / 2.25rem
- `text-4xl`: 2.25rem / 2.5rem
- `text-5xl`: 3rem / 1
- `text-6xl`: 3.75rem / 1

**Usage:**
```tsx
<h1 className="text-5xl font-bold">Main Heading</h1>
<h2 className="text-3xl font-bold">Section Heading</h2>
<p className="text-base">Body text</p>
<span className="text-sm text-neutral-600">Small text</span>
```

## Dark Mode

Dark mode is automatically supported by using `dark:` prefix for classes.

### How Dark Mode Works

1. Dark mode class is applied to the `<html>` element when toggling
2. Theme preference is persisted in localStorage
3. System preference is respected on first load

### Dark Mode Patterns

```tsx
// Background: light on light, dark on dark
className="bg-white dark:bg-neutral-900"

// Text: dark on light, light on dark
className="text-neutral-900 dark:text-neutral-50"

// Borders: light borders on light bg, dark borders on dark bg
className="border-neutral-200 dark:border-neutral-800"

// Semantic colors automatically adjust
className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100"
```

### Global Dark Mode Styles

Global styles in `globals.css` handle:
- Body background and text color transitions
- Smooth color transitions with `transition-colors duration-200`
- Focus ring styling adjusted for dark mode offset
- Link colors adapted for dark mode

## Box Shadows

Custom shadow system designed to work well in both light and dark modes:

- `shadow-xs`: Minimal shadow
- `shadow-sm`: Small shadow
- `shadow-base`: Default shadow
- `shadow-md`: Medium shadow
- `shadow-lg`: Large shadow
- `shadow-xl`: Extra large shadow
- `shadow-2xl`: Huge shadow
- `shadow-dark`: Special shadow optimized for dark mode

```tsx
<Card className="shadow-lg dark:shadow-dark">Content</Card>
```

## Spacing Scale

Standard Tailwind spacing (0, 1, 2, 4, 6, 8, 10, 12, 16, etc.) plus custom additions:

- `space-128`: 32rem (512px)
- `space-144`: 36rem (576px)

```tsx
<div className="space-y-8">Multiple items with 2rem gap</div>
<div className="gap-4">Flex gap</div>
```

## Border Radius

Consistent rounded corner scale:

- `rounded`: 0.25rem
- `rounded-md`: 0.375rem
- `rounded-lg`: 0.5rem (default for cards)
- `rounded-xl`: 0.75rem
- `rounded-2xl`: 1rem
- `rounded-3xl`: 1.5rem (custom)
- `rounded-full`: 9999px

```tsx
<Button className="rounded-lg">Standard</Button>
<Card className="rounded-xl">Card</Card>
<div className="rounded-3xl">Large radius</div>
```

## Focus States

Consistent focus states using rings:

```tsx
// Automatically applied to interactive elements
className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
```

## Utility Classes

Custom utility classes defined in `globals.css`:

### Container Classes
- `.container-fluid`: Full width with horizontal padding (responsive)
- `.container-base`: Max width 7xl with horizontal padding (responsive)

```tsx
<div className="container-base">Content</div>
```

### Transition Class
- `.transition-all`: Smooth transitions on all properties

```tsx
<button className="transition-all hover:scale-105">Hover me</button>
```

## Design System Best Practices

### 1. Color Contrast
- Always ensure sufficient contrast for accessibility
- Use `text-neutral-900 dark:text-neutral-50` for body text
- Use `text-neutral-600 dark:text-neutral-400` for secondary text

### 2. Semantic Color Usage
- Use `success` for positive states
- Use `warning` for caution states
- Use `error` for destructive/error states
- Use `info` for informational states

### 3. Consistent Spacing
- Use multiples of 4px (Tailwind's default)
- Maintain vertical rhythm with line heights
- Use gap utilities for flex/grid spacing

### 4. Dark Mode Considerations
- Test all components in both light and dark modes
- Use semantic color changes, not just inverse colors
- Consider different shadow approaches for dark mode
- Always provide dark mode variants for custom colors

### 5. Accessibility
- Maintain focus states on all interactive elements
- Use semantic HTML elements
- Provide alt text for images
- Ensure color is not the only indicator of state

## Examples

### Card with Dark Mode
```tsx
<Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
  <CardHeader>
    <CardTitle className="text-neutral-900 dark:text-neutral-50">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-neutral-600 dark:text-neutral-400">
    Content
  </CardContent>
</Card>
```

### Badge with Semantic Color
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

### Button with State Transitions
```tsx
<Button 
  className="transition-all hover:scale-105 active:scale-95"
  variant="primary"
>
  Click me
</Button>
```

## Extending the Theme

To add custom colors or modify existing ones, edit `tailwind.config.ts`:

```typescript
const config: Config = {
  theme: {
    extend: {
      colors: {
        // Add your custom color
        brand: {
          50: '#f0f5fa',
          // ... rest of the palette
        },
      },
    },
  },
};
```

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS Customization](https://tailwindcss.com/docs/theme)
