# @labsync/design-system

Shared design system for LabSync applications. Provides the Tailwind preset, CSS custom properties, and utilities needed to maintain a consistent look and feel across all LabSync apps.

## What's included

| Export | Description |
|--------|-------------|
| `labsyncPreset` | Tailwind preset — colors, fonts, border radius, animations, safelist, `tailwindcss-animate` plugin |
| `styles.css` | CSS custom properties (light + dark mode), base styles, checkbox styling, highlight animations |
| `cn()` | `clsx` + `tailwind-merge` utility for conditional class names |
| `components.json` | shadcn/ui config template for adding pre-styled components |

## Setup

### 1. Install the package

During development, reference it as a local file dependency:

```bash
npm install @labsync/design-system@file:../rodgers-labsync/packages/design-system
```

### 2. Add `transpilePackages` to your Next.js config

```js
// next.config.js
const nextConfig = {
  transpilePackages: ['@labsync/design-system'],
  // ...
};
module.exports = nextConfig;
```

### 3. Configure Tailwind

Create or update `tailwind.config.ts` to use the preset. You only need to provide `content` paths — the preset supplies everything else (colors, fonts, border radius, animations, safelist, plugins).

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import { labsyncPreset } from '@labsync/design-system';

export default {
  presets: [labsyncPreset as Config],
  content: [
    './src/**/*.{ts,tsx,mdx}',
  ],
} satisfies Config;
```

### 4. Import styles in your root layout

Import the design-system stylesheet **before** your app's `globals.css` so the CSS custom properties are defined before Tailwind processes them.

```tsx
// src/app/layout.tsx
import '@labsync/design-system/styles.css';
import './globals.css';
```

Your `globals.css` only needs the Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Re-export `cn()` for shadcn/ui compatibility

shadcn/ui components import `cn` from `@/lib/utils`. Create a bridge file so they resolve correctly:

```ts
// src/lib/utils.ts
export { cn } from '@labsync/design-system';
```

## Adding shadcn/ui components

Copy `components.json` from this package into your project root, then use the shadcn CLI to add components:

```bash
cp node_modules/@labsync/design-system/components.json .
npx shadcn@latest add button card dialog
```

The generated components will use the LabSync theme automatically via the CSS custom properties and Tailwind preset.

## Dark mode

The preset sets `darkMode: ['class']`. Add the `dark` class to your `<html>` element to activate dark mode:

```tsx
<html lang="en" className="dark">
```

## What the preset provides

### Colors

All colors reference CSS custom properties, so light/dark mode is handled entirely through the stylesheet:

`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1` through `chart-5`, and the full `sidebar` palette.

### Fonts

| Token | Value |
|-------|-------|
| `font-body` | Inter, sans-serif |
| `font-headline` | Inter, sans-serif |
| `font-code` | monospace |
| `font-sans` | var(--font-sans), sans-serif |

### Border radius

| Token | Value |
|-------|-------|
| `rounded-lg` | var(--radius) — 0.5rem |
| `rounded-md` | calc(var(--radius) - 2px) |
| `rounded-sm` | calc(var(--radius) - 4px) |

## Building the package

From the rodgers-labsync repo root:

```bash
npm run build -w @labsync/design-system
```

This produces `dist/` containing `index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, and `styles.css`.
