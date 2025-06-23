# Development Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher (LTS recommended)
- **Package Manager**: pnpm v8.0.0 or higher (preferred) or npm v9.0.0+
- **Git**: Latest stable version
- **Operating System**: macOS, Linux, or Windows with WSL2

### Development Tools
- **Code Editor**: VS Code (recommended) with Astro extension
- **Browser**: Chrome/Firefox with developer tools
- **Terminal**: Modern terminal with color support

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

## Project Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd MARSPOPULATION
```

### 2. Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Environment Configuration
Create `.env` file in project root:
```bash
# Copy from example
cp .env.example .env

# Edit with your values
```

Required environment variables:
```env
# Stripe (for development, use test keys)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Analytics (optional for development)
PUBLIC_PLAUSIBLE_DOMAIN=localhost

# Site Configuration
PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Development Server
```bash
# Start development server
pnpm dev

# Server will be available at http://localhost:3000
```

## Project Structure

```
MARSPOPULATION/
├── docs/                     # Documentation files
├── src/
│   ├── components/           # Reusable components
│   │   ├── globe/           # Mars globe components
│   │   ├── ui/              # UI components
│   │   └── layout/          # Layout components
│   ├── content/             # Content collections
│   │   ├── blog/            # Blog articles (MDX)
│   │   └── locations/       # Mars location data (JSON)
│   ├── layouts/             # Page layouts
│   ├── pages/               # Route pages
│   ├── styles/              # Global styles
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
│   ├── images/              # Images and graphics
│   ├── mars-data/           # Mars textures and elevation data
│   └── favicon.ico
├── netlify/                 # Netlify-specific files
│   └── functions/           # Serverless functions
├── astro.config.mjs         # Astro configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Development Workflow

### Available Scripts
```bash
# Development
pnpm dev          # Start development server
pnpm dev:host     # Start with network access

# Building
pnpm build        # Build for production
pnpm preview      # Preview production build

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix linting issues
pnpm format       # Format code with Prettier
pnpm type-check   # Run TypeScript checking

# Testing
pnpm test         # Run all tests
pnpm test:e2e     # Run E2E tests
pnpm test:unit    # Run unit tests

# Utilities
pnpm clean        # Clean build artifacts
pnpm analyze      # Bundle size analysis
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Convention
Follow conventional commits:
```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## Component Development

### Creating Components

#### Astro Components
```astro
---
// src/components/ExampleComponent.astro
export interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<div class="example-component">
  <h2>{title}</h2>
  {description && <p>{description}</p>}
</div>

<style>
  .example-component {
    @apply bg-white rounded-lg shadow-md p-6;
  }
</style>
```

#### React Components (Islands)
```tsx
// src/components/InteractiveExample.tsx
import { useState } from 'react';

interface Props {
  initialValue: string;
}

export default function InteractiveExample({ initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  
  return (
    <div className="interactive-example">
      <input 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <p>Current value: {value}</p>
    </div>
  );
}
```

### Mars Globe Development

#### Local Development Setup
1. **Texture Assets**: Download Mars texture files to `public/mars-data/`
2. **Test Data**: Use sample location data in `src/content/locations/`
3. **WebGL Context**: Enable hardware acceleration in browser settings

#### Globe Component Structure
```tsx
// src/components/globe/MarsGlobe.tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Planet } from './Planet';
import { LocationMarkers } from './LocationMarkers';
import { Controls } from './Controls';

export default function MarsGlobe({ locations, onLocationSelect }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <Suspense fallback={<LoadingSpinner />}>
        <Planet />
        <LocationMarkers 
          locations={locations}
          onSelect={onLocationSelect}
        />
        <Controls />
      </Suspense>
    </Canvas>
  );
}
```

### Content Development

#### Blog Articles
Create new articles in `src/content/blog/`:
```markdown
---
title: "Your Article Title"
description: "Brief description for SEO"
pubDate: 2025-06-22
author: "Author Name"
tags: ["terraforming", "science"]
---

# Article Content

Your article content in MDX format...

<InteractiveComponent prop="value" />
```

#### Location Data
Add location data in `src/content/locations/`:
```json
{
  "id": "olympus-mons",
  "name": "Olympus Mons",
  "coordinates": {
    "lat": 18.65,
    "lng": -133.8
  },
  "elevation": 21287,
  "description": "The largest volcano in the solar system",
  "terraformingPotential": {
    "rating": 8,
    "factors": ["elevated position", "mineral resources"]
  },
  "relatedArticles": ["olympus-mons-exploration", "volcanic-resources"]
}
```

## Styling Guidelines

### Tailwind CSS Usage
```css
/* Use utility classes for common patterns */
.card {
  @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}

/* Custom utilities for project-specific needs */
.mars-text {
  @apply text-red-800 dark:text-red-300;
}

.gwern-prose {
  @apply prose prose-slate max-w-none dark:prose-invert;
}
```

### Dark Theme Implementation
```css
/* Use Tailwind's dark mode classes */
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

### Responsive Design
```css
/* Mobile-first approach */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Cards
</div>
```

## Testing Setup

### Unit Testing (Vitest)
```javascript
// src/utils/__tests__/coordinates.test.ts
import { describe, it, expect } from 'vitest';
import { convertCoordinates } from '../coordinates';

describe('convertCoordinates', () => {
  it('converts lat/lng to 3D position', () => {
    const result = convertCoordinates(0, 0);
    expect(result).toEqual({ x: 1, y: 0, z: 0 });
  });
});
```

### E2E Testing (Playwright)
```javascript
// tests/globe-interaction.spec.ts
import { test, expect } from '@playwright/test';

test('user can interact with Mars globe', async ({ page }) => {
  await page.goto('/');
  
  // Wait for globe to load
  await page.waitForSelector('[data-testid="mars-globe"]');
  
  // Click on a location
  await page.click('[data-location="olympus-mons"]');
  
  // Check info panel appears
  await expect(page.locator('[data-testid="info-panel"]')).toBeVisible();
});
```

## Debugging

### Development Tools
```bash
# Enable debug mode
DEBUG=true pnpm dev

# Analyze bundle size
pnpm build && pnpm analyze

# Check TypeScript errors
pnpm type-check
```

### Browser DevTools
- **Console**: Check for JavaScript errors
- **Network**: Monitor asset loading performance
- **Performance**: Profile Mars globe rendering
- **Application**: Check service worker and caching

### Three.js Debugging
```javascript
// Add to globe component for debugging
import { Stats } from 'three/examples/jsm/libs/Stats.js';

// Show FPS counter
const stats = new Stats();
document.body.appendChild(stats.dom);

// In render loop
stats.update();
```

## Performance Optimization

### Build Optimization
```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'three-vendor': ['three', '@react-three/fiber']
          }
        }
      }
    }
  }
});
```

### Image Optimization
```bash
# Optimize Mars textures
pnpm run optimize-images

# Generate responsive images
pnpm run generate-responsive
```

### Performance Monitoring
```javascript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Deployment

### Local Build Testing
```bash
# Build and test locally
pnpm build
pnpm preview

# Test serverless functions locally
netlify dev
```

### Netlify Deployment
1. **Connect Repository**: Link GitHub repo to Netlify
2. **Build Settings**: 
   - Build command: `pnpm build`
   - Publish directory: `dist`
3. **Environment Variables**: Add production keys
4. **Deploy**: Automatic on push to main branch

### Environment Variables for Production
```env
# Production Stripe keys
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Analytics
PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Site configuration
PUBLIC_SITE_URL=https://yourdomain.com
```

## Troubleshooting

### Common Issues

#### WebGL Context Lost
```javascript
// Handle WebGL context loss
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  // Reinitialize globe
  reinitializeGlobe();
});
```

#### Slow Build Times
```bash
# Clear cache
pnpm clean

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Type Errors
```bash
# Check TypeScript configuration
pnpm type-check

# Update type definitions
pnpm update @types/*
```

### Getting Help
- **Documentation**: Check Astro and Three.js docs
- **Community**: Astro Discord, Three.js Forum
- **Issues**: GitHub repository issues
- **Team**: Internal team communication channels

## Code Style Guidelines

### TypeScript
```typescript
// Use strict types
interface LocationData {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Prefer interfaces over types for objects
interface Props {
  title: string;
  optional?: boolean;
}
```

### Component Organization
```
components/
├── globe/
│   ├── index.ts          # Export barrel
│   ├── MarsGlobe.tsx     # Main component
│   ├── Planet.tsx        # Sub-components
│   └── LocationMarkers.tsx
└── ui/
    ├── Button.tsx
    └── Modal.tsx
```

### Import Organization
```typescript
// External libraries
import React from 'react';
import { Canvas } from '@react-three/fiber';

// Internal utilities
import { convertCoordinates } from '../utils/coordinates';

// Components
import { Planet } from './Planet';

// Types
import type { LocationData } from '../types/location';
```