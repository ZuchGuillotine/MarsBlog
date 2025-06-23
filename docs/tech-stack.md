# Tech Stack Documentation

## Overview

This document outlines the technology choices for the Terraforming Mars Interactive Exploration Website, including rationale for each decision and implementation details.

## Core Technologies

### Static Site Generator: Astro
- **Version**: Latest stable
- **Rationale**: Island architecture allows zero JS by default with opt-in interactive components
- **Key Features**:
  - Static HTML generation at build time
  - Component islands for interactive elements (Mars globe)
  - Built-in TypeScript support
  - Excellent performance characteristics

### 3D Rendering: Three.js + React Three Fiber
- **Three.js Version**: r150+
- **React Three Fiber**: Latest stable
- **Rationale**: 
  - Mature WebGL library with extensive Mars terrain examples
  - React Three Fiber provides declarative React bindings
  - Strong community support and documentation
- **Key Features**:
  - WebGL-based 3D rendering
  - Efficient geometry and material handling
  - Built-in controls for camera manipulation
  - Support for texture mapping and elevation data

### Styling: Tailwind CSS + CSS Variables
- **Tailwind CSS**: v3.x
- **Rationale**: 
  - Rapid development with utility classes
  - Easy dark theme implementation
  - Consistent design system
  - Excellent tree-shaking for production builds
- **Custom CSS Variables**: For Gwern-inspired typography and color schemes

### Content Management: Astro MDX
- **Rationale**: Allows React components within markdown content
- **Features**:
  - Markdown-driven blog posts
  - Component embedding in content
  - Automatic syntax highlighting
  - Frontmatter support for metadata

### Search: Lunr.js
- **Version**: Latest stable
- **Rationale**: Client-side search without backend requirements
- **Features**:
  - Static search index generation at build time
  - Full-text search capabilities
  - Lightweight and fast

## Development & Build Tools

### Package Manager: npm/pnpm
- **Recommendation**: pnpm for faster installs and better dependency management
- **Lock file**: Committed to repository for consistent builds

### TypeScript
- **Version**: Latest stable
- **Configuration**: Strict mode enabled
- **Benefits**: Type safety, better IDE support, reduced runtime errors

### Linting & Formatting
- **ESLint**: Astro-specific configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## Hosting & Infrastructure

### Static Hosting: Netlify
- **Primary Choice**: Netlify
- **Alternative**: Vercel
- **Features**:
  - CDN distribution
  - Automatic deploys from Git
  - Built-in serverless functions
  - Environment variable management

### Serverless Functions: Netlify Functions
- **Runtime**: Node.js
- **Purpose**: Stripe payment processing
- **Security**: Environment variables for API keys

### CDN Strategy
- **Static Assets**: Served via Netlify CDN
- **Mars Textures**: Optimized and cached
- **Elevation Data**: Compressed binary formats

## Payment Processing

### Stripe Integration
- **Stripe Checkout**: Hosted payment pages
- **Webhook Handling**: Via Netlify Functions
- **Security**: Server-side session creation
- **Supported Methods**: Cards, digital wallets

## Analytics & Monitoring

### Analytics: Plausible
- **Rationale**: Privacy-focused, GDPR compliant
- **Alternative**: Netlify Analytics
- **Metrics**: Page views, session duration, conversion tracking

### Performance Monitoring
- **Lighthouse CI**: Automated performance testing
- **Core Web Vitals**: Tracked in production
- **Bundle Analysis**: Webpack Bundle Analyzer

## Security Considerations

### Content Security Policy (CSP)
```
script-src 'self' 'unsafe-inline' *.stripe.com *.plausible.io;
style-src 'self' 'unsafe-inline';
img-src 'self' data: *.stripe.com;
connect-src 'self' *.stripe.com *.plausible.io;
```

### HTTPS Enforcement
- **Netlify**: Automatic HTTPS
- **Redirect**: All HTTP to HTTPS

### Environment Variables
- **Stripe Keys**: Server-side only
- **Analytics Keys**: Client-safe public keys

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Code Quality
- **Pre-commit**: ESLint + Prettier
- **CI/CD**: GitHub Actions
- **Testing**: Playwright for E2E testing

## Performance Targets

### Bundle Size
- **Initial JS**: < 200KB gzipped
- **CSS**: < 50KB gzipped
- **Critical Path**: Inlined CSS for above-fold content

### Loading Performance
- **LCP**: < 2.5s (desktop), < 4s (mobile)
- **FID**: < 100ms
- **CLS**: < 0.1

### Optimization Strategies
- **Code Splitting**: Lazy load non-critical components
- **Image Optimization**: WebP/AVIF with fallbacks
- **Preloading**: Critical resources
- **Service Worker**: Static asset caching

## Browser Support

### Minimum Requirements
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Graceful Degradation
- **WebGL Fallback**: 2D canvas for older browsers
- **Reduced Motion**: Respect user preferences
- **Progressive Enhancement**: Core functionality without JS

## Third-Party Dependencies

### Production Dependencies
- **astro**: Static site generation
- **three**: 3D rendering
- **@react-three/fiber**: React bindings for Three.js
- **tailwindcss**: Utility-first CSS
- **lunr**: Search functionality
- **stripe**: Payment processing

### Development Dependencies
- **typescript**: Type checking
- **eslint**: Code linting
- **prettier**: Code formatting
- **playwright**: E2E testing
- **vite**: Build tool (via Astro)

## Deployment Strategy

### Build Pipeline
1. **Install Dependencies**: pnpm install
2. **Type Check**: TypeScript compilation
3. **Lint**: ESLint validation
4. **Test**: Playwright E2E tests
5. **Build**: Astro static generation
6. **Deploy**: Netlify deployment

### Environment Configuration
- **Development**: Local development server
- **Staging**: Preview deployments on Netlify
- **Production**: Main branch auto-deploy

### Rollback Strategy
- **Netlify**: Instant rollback to previous deployment
- **Git**: Revert commits for critical issues
- **Feature Flags**: Gradual feature rollout

## Maintenance & Updates

### Dependency Updates
- **Monthly**: Security updates
- **Quarterly**: Major version updates
- **Automated**: Dependabot for security patches

### Performance Monitoring
- **Weekly**: Lighthouse reports
- **Monthly**: Bundle size analysis
- **Quarterly**: Dependency audit

### Backup Strategy
- **Git**: Source code version control
- **Netlify**: Deployment history
- **Content**: Markdown files in repository