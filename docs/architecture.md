# System Architecture Documentation

## Overview

This document describes the technical architecture of the Terraforming Mars Interactive Exploration Website, including system components, data flow, deployment strategy, and integration patterns.

## Architecture Principles

### Static-First Approach
- **Principle**: Generate maximum content at build time
- **Benefits**: Faster loading, better SEO, reduced server costs
- **Implementation**: Astro's static site generation with selective hydration

### Island Architecture
- **Principle**: Interactive components as isolated islands in static HTML
- **Benefits**: Minimal JavaScript bundle, optimal performance
- **Implementation**: Astro islands for Mars globe and interactive elements

### Progressive Enhancement
- **Principle**: Core functionality works without JavaScript
- **Benefits**: Accessibility, reliability, broader device support
- **Implementation**: Semantic HTML with JavaScript enhancements

## System Components

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│  Static HTML/CSS  │  Interactive Islands  │  Service Worker │
│  ┌─────────────┐  │  ┌─────────────────┐  │  ┌─────────────┐ │
│  │ Navigation  │  │  │   Mars Globe    │  │  │   Caching   │ │
│  │ Articles    │  │  │   Search UI     │  │  │   Offline   │ │
│  │ Footer      │  │  │   Collapsibles  │  │  │   Updates   │ │
│  └─────────────┘  │  └─────────────────┘  │  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Build-Time Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Content Sources   │    │   Build Process     │    │   Static Output     │
├─────────────────────┤    ├─────────────────────┤    ├─────────────────────┤
│ • Markdown Files    │    │ • Astro Build       │    │ • Static HTML       │
│ • JSON Data         │───▶│ • TypeScript        │───▶│ • CSS Bundles       │
│ • Asset Files       │    │   Compilation       │    │ • JS Islands        │
│ • Configuration     │    │ • Image Optimization│    │ • Optimized Assets  │
└─────────────────────┘    │ • Search Index Gen  │    └─────────────────────┘
                          └─────────────────────┘
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Netlify CDN                             │
├─────────────────────────────────────────────────────────────────┤
│  Edge Locations (Global)                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Static Files  │  │  Serverless     │  │   Analytics     │  │
│  │   • HTML/CSS    │  │  Functions      │  │   • Performance │  │
│  │   • JS Bundles  │  │  • Stripe API   │  │   • User Events │  │
│  │   • Images      │  │  • Form Handler │  │   • Error Logs  │  │
│  │   • Mars Data   │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Content Management

```
/src/content/
├── blog/
│   ├── terraforming-basics.md
│   ├── olympus-mons.md
│   └── water-extraction.md
├── locations/
│   ├── olympus-mons.json
│   ├── valles-marineris.json
│   └── polar-ice-caps.json
└── config/
    ├── site.json
    ├── navigation.json
    └── hotspots.json
```

### Data Flow Patterns

#### 1. Build-Time Data Processing
```
Markdown Files → Astro Content API → Static HTML → CDN
     ↓                ↓                  ↓         ↓
  Frontmatter → Content Collection → Page Routes → Cache
```

#### 2. Client-Side Interactions
```
User Action → Globe Component → State Update → UI Refresh
     ↓             ↓              ↓            ↓
  Click/Hover → Ray Casting → Location Data → Info Panel
```

#### 3. Search Functionality
```
Build Time: Content → Lunr Index → Static JSON
Runtime:    Query → Index Search → Results → UI Update
```

## Component Architecture

### Mars Globe Component (Island)

```typescript
interface MarsGlobeProps {
  locations: LocationData[];
  onLocationSelect: (location: LocationData) => void;
  onLocationHover: (location: LocationData | null) => void;
}

// Component Hierarchy
MarsGlobe
├── Scene (Three.js Canvas)
│   ├── PlanetMesh (Mars geometry + textures)
│   ├── LocationMarkers (Interactive hotspots)
│   └── CameraControls (Orbit controls)
├── InfoPanel (Location details)
└── LoadingState (Progressive loading)
```

### Page Layout Architecture

```
BaseLayout
├── Header
│   ├── Navigation
│   ├── Logo
│   └── DonationCTA
├── Main
│   ├── PageContent (slot)
│   └── InteractiveIslands
└── Footer
    ├── Links
    ├── Newsletter
    └── SocialMedia
```

## API Architecture

### Serverless Functions

#### Stripe Payment Handler (`/api/stripe-checkout`)
```javascript
// Input
{
  amount: number;
  currency: 'USD';
  successUrl: string;
  cancelUrl: string;
}

// Output
{
  sessionId: string;
  checkoutUrl: string;
}
```

#### Newsletter Subscription (`/api/newsletter`)
```javascript
// Input
{
  email: string;
  source: 'footer' | 'thank-you' | 'article';
}

// Output
{
  success: boolean;
  message: string;
}
```

### External API Integration

#### Stripe API
- **Purpose**: Payment processing
- **Authentication**: Secret key via environment variables
- **Rate Limits**: Handled with exponential backoff
- **Error Handling**: Graceful fallback messages

#### Analytics API (Plausible)
- **Purpose**: Privacy-friendly analytics
- **Integration**: Client-side script injection
- **Data**: Page views, custom events, goal tracking

## Security Architecture

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' *.stripe.com *.plausible.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: *.stripe.com;
  connect-src 'self' *.stripe.com *.plausible.io;
  font-src 'self';
  frame-src *.stripe.com;
```

### Environment Variables Management
```
# Build-time (public)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
PUBLIC_PLAUSIBLE_DOMAIN=terraformingmars.dev

# Server-side (private)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Data Protection
- **Encryption**: HTTPS enforced everywhere
- **Privacy**: No personal data collection without consent
- **Compliance**: GDPR/CCPA compliant analytics
- **Authentication**: No user accounts in MVP

## Performance Architecture

### Loading Strategy
```
Critical Path:
HTML → Critical CSS → Font Loading → Initial Render
                  ↓
              Non-critical Assets:
              Globe JS → Textures → Interactive Ready
```

### Caching Strategy
- **Static Assets**: 1 year cache-control
- **HTML Pages**: 1 hour cache-control
- **API Responses**: No-cache for dynamic content
- **Service Worker**: Application shell caching

### Bundle Optimization
```
Main Bundle (Critical):
├── Astro Runtime (~10KB)
├── Critical CSS (~15KB)
└── Font Loading (~5KB)

Globe Bundle (Deferred):
├── Three.js (~150KB)
├── React Three Fiber (~30KB)
└── Globe Component (~20KB)
```

## Monitoring & Observability

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle Size**: Automated alerts for size increases
- **Lighthouse CI**: Automated performance testing
- **Real User Monitoring**: Via Plausible analytics

### Error Monitoring
- **Client Errors**: Console error tracking
- **Server Errors**: Netlify function logs
- **Performance Issues**: Slow query identification
- **User Journey**: Funnel analysis for donations

### Health Checks
- **Build Status**: GitHub Actions monitoring
- **Deployment Health**: Netlify deploy notifications
- **Third-party Services**: Stripe/Plausible status
- **CDN Performance**: Global response time monitoring

## Scalability Considerations

### Traffic Scaling
- **CDN Distribution**: Global edge locations
- **Static Assets**: Infinite scalability via CDN
- **Serverless Functions**: Auto-scaling up to limits
- **Database**: No database requirements for MVP

### Content Scaling
- **Build Performance**: Incremental builds for large content
- **Search Index**: Optimized for thousands of articles
- **Asset Management**: Automated image optimization
- **Content Delivery**: Progressive loading strategies

### Development Scaling
- **Team Collaboration**: Clear component boundaries
- **Code Organization**: Feature-based folder structure
- **Testing Strategy**: Unit + E2E + Visual regression
- **Documentation**: Automated docs generation

## Disaster Recovery

### Backup Strategy
- **Source Code**: Git repository with multiple remotes
- **Content**: Markdown files in version control
- **Build Artifacts**: Netlify deployment history
- **Configuration**: Environment variables documented

### Rollback Procedures
1. **Instant Rollback**: Netlify previous deployment
2. **Code Rollback**: Git revert + redeploy
3. **Content Rollback**: Revert content changes
4. **Database**: No database to restore (stateless)

### Service Dependencies
- **Primary**: Netlify (hosting)
- **Secondary**: Stripe (payments)
- **Tertiary**: Plausible (analytics)
- **Fallbacks**: Alternative hosting/services documented

## Integration Patterns

### Third-Party Services
```javascript
// Stripe Integration Pattern
const stripe = new Stripe(publicKey);
const checkout = await stripe.redirectToCheckout({
  sessionId: response.sessionId
});

// Analytics Integration Pattern
window.plausible = window.plausible || function() {
  (window.plausible.q = window.plausible.q || []).push(arguments)
};
```

### Component Communication
```javascript
// Parent-Child Props Pattern
<MarsGlobe 
  locations={locations}
  onLocationSelect={handleLocationSelect}
/>

// Event-Driven Pattern
globe.addEventListener('location-hover', (event) => {
  updateInfoPanel(event.detail.location);
});
```

### State Management
```javascript
// Local Component State (React)
const [selectedLocation, setSelectedLocation] = useState(null);

// Global State (Zustand - if needed)
const useGlobeStore = create((set) => ({
  selectedLocation: null,
  setLocation: (location) => set({ selectedLocation: location })
}));
```

## Future Architecture Considerations

### Phase 2 Enhancements
- **User Authentication**: Add user accounts and preferences
- **Real-time Features**: WebSocket connections for live data
- **Advanced Search**: Elasticsearch integration
- **Content Management**: Headless CMS integration

### Scalability Improvements
- **Micro-frontends**: Separate teams/deployments
- **Edge Computing**: Cloudflare Workers for dynamic content
- **Database Integration**: For user-generated content
- **API Gateway**: Centralized API management

### Technology Evolution
- **WebAssembly**: High-performance 3D rendering
- **HTTP/3**: Improved loading performance
- **Progressive Web App**: Offline functionality
- **Web Components**: Framework-agnostic components