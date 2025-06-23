# Component Specifications

## Overview

This document provides detailed specifications for all major components in the Terraforming Mars Interactive Exploration Website, including props, state management, styling, and implementation guidelines.

## Mars Globe Components

### MarsGlobe (Primary Island Component)

**Purpose**: Main interactive 3D Mars globe with location hotspots and user interactions.

**Technology**: React + Three.js + React Three Fiber

```typescript
interface MarsGlobeProps {
  locations: LocationData[];
  initialLocation?: string;
  onLocationSelect: (location: LocationData) => void;
  onLocationHover: (location: LocationData | null) => void;
  className?: string;
  loading?: boolean;
}

interface LocationData {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevation: number;
  description: string;
  terraformingPotential: {
    rating: number;
    factors: string[];
  };
  relatedArticles: string[];
}
```

**Key Features**:
- WebGL-based 3D rendering with Mars textures
- Interactive location hotspots with hover states
- Smooth camera controls (mouse/touch)
- Progressive loading with fallback states
- Accessibility support via keyboard navigation

**State Management**:
```typescript
interface GlobeState {
  selectedLocation: LocationData | null;
  hoveredLocation: LocationData | null;
  isLoading: boolean;
  cameraPosition: [number, number, number];
  globeRotation: [number, number, number];
}
```

**Implementation Notes**:
- Use `useFrame` for smooth rotation animation
- Implement raycasting for location detection
- Handle WebGL context loss gracefully
- Lazy load high-resolution textures

### Planet

**Purpose**: Mars sphere geometry with realistic textures and elevation data.

```typescript
interface PlanetProps {
  radius?: number;
  segments?: number;
  textureUrl: string;
  elevationUrl?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}
```

**Materials**:
- Diffuse texture: Mars surface imagery
- Normal map: Surface detail enhancement  
- Displacement map: Elevation data for 3D terrain
- Emissive map: Atmospheric glow effects

### LocationMarkers

**Purpose**: Interactive hotspots on Mars surface for significant locations.

```typescript
interface LocationMarkersProps {
  locations: LocationData[];
  onLocationClick: (location: LocationData) => void;
  onLocationHover: (location: LocationData | null) => void;
  selectedLocation?: string;
  markerScale?: number;
}
```

**Visual Design**:
- Animated pulsing effect for attention
- Scale on hover for better visibility
- Color coding by terraforming potential
- Billboard orientation toward camera

### CameraControls  

**Purpose**: Smooth camera movement and user interaction handling.

```typescript
interface CameraControlsProps {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}
```

**Interaction Features**:
- Mouse drag for rotation
- Scroll wheel for zoom
- Touch gestures for mobile
- Keyboard arrow keys for accessibility
- Smooth easing for all movements

## UI Components

### InfoPanel

**Purpose**: Display location details when user hovers/clicks on globe hotspots.

```typescript
interface InfoPanelProps {
  location: LocationData | null;
  isVisible: boolean;
  onClose: () => void;
  onReadMore: (articleSlug: string) => void;
  position?: 'right' | 'left' | 'bottom';
}
```

**Content Structure**:
- Location name and coordinates
- Elevation and basic statistics
- Terraforming potential rating
- Brief description
- Related article links
- External research links

**Animation**:
- Slide-in from right side
- Fade transition for content changes
- Auto-hide after inactivity timeout

### DonationButton

**Purpose**: Call-to-action button for Stripe donation flow.

```typescript
interface DonationButtonProps {
  variant?: 'primary' | 'secondary' | 'subtle';
  size?: 'small' | 'medium' | 'large';
  position?: 'navbar' | 'footer' | 'article';
  customAmount?: boolean;
  presetAmounts?: number[];
  onSuccess?: (sessionId: string) => void;
  onError?: (error: string) => void;
}
```

**Stripe Integration**:
- Create checkout session via serverless function
- Handle success/cancel redirects
- Track conversion events
- Display loading states during processing

### SearchBox

**Purpose**: Full-text search interface using Lunr.js static index.

```typescript
interface SearchBoxProps {
  placeholder?: string;
  maxResults?: number;
  onResultSelect: (result: SearchResult) => void;
  onSearchChange?: (query: string) => void;
  autoFocus?: boolean;
}

interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: 'article' | 'location' | 'page';
  score: number;
}
```

**Features**:
- Real-time search as you type
- Keyboard navigation (arrow keys, enter)
- Result highlighting
- Search suggestions
- Recent searches (localStorage)

### CollapsibleSection

**Purpose**: Expandable content sections for blog articles (Gwern-style).

```typescript
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: 1 | 2 | 3 | 4;
  icon?: 'arrow' | 'plus' | 'chevron';
  onToggle?: (isOpen: boolean) => void;
}
```

**Implementation**:
- Use `<details>` and `<summary>` for semantic HTML
- CSS animations for smooth expand/collapse
- Keyboard accessibility (space/enter to toggle)
- Save state in sessionStorage

## Layout Components

### BaseLayout

**Purpose**: Main page wrapper with header, footer, and content area.

```typescript
interface BaseLayoutProps {
  title: string;
  description?: string;
  ogImage?: string;
  children: React.ReactNode;
  showDonationCTA?: boolean;
  className?: string;
}
```

**SEO Features**:
- Dynamic meta tags
- OpenGraph image generation
- Structured data injection
- Canonical URL management

### Header

**Purpose**: Main site navigation with logo, menu items, and donation CTA.

```typescript
interface HeaderProps {
  currentPath: string;
  showDonationButton?: boolean;
  transparent?: boolean;
  sticky?: boolean;
}
```

**Navigation Items**:
- Home (globe page)
- Explore (blog hub)
- Locations (location index)
- About (project info)
- Support (donation page)

**Responsive Behavior**:
- Hamburger menu on mobile
- Sticky positioning on scroll
- Dark/light theme toggle

### Footer

**Purpose**: Site footer with links, newsletter signup, and social media.

```typescript
interface FooterProps {
  showNewsletter?: boolean;
  showSocialLinks?: boolean;
  compactMode?: boolean;
}
```

**Content Sections**:
- Quick links (About, Privacy, Terms)
- Newsletter subscription form
- Social media icons
- Copyright and attribution

## Article Components

### ArticleLayout

**Purpose**: Consistent layout for blog articles with metadata and navigation.

```typescript
interface ArticleLayoutProps {
  frontmatter: ArticleFrontmatter;
  children: React.ReactNode;
  relatedArticles?: ArticleMeta[];
  showDonationCTA?: boolean;
}

interface ArticleFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  tags: string[];
  readingTime?: number;
  lastModified?: Date;
}
```

**Features**:
- Article metadata display
- Reading time estimation
- Social sharing buttons
- Related articles sidebar
- Table of contents generation

### CodeBlock

**Purpose**: Syntax-highlighted code blocks with copy functionality.

```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  copyable?: boolean;
}
```

**Styling**:
- Syntax highlighting via Prism.js
- Dark theme support
- Copy-to-clipboard button
- Line number indicators

### CitationPopup

**Purpose**: Hover popups for footnotes and citations.

```typescript
interface CitationPopupProps {
  citationId: string;
  content: string;
  position?: 'top' | 'bottom' | 'auto';
  delay?: number;
}
```

**Behavior**:
- Show on hover with delay
- Position automatically to stay in viewport
- Hide on mouse leave or click outside
- Keyboard accessible (focus/blur)

## Form Components

### NewsletterForm

**Purpose**: Email subscription form for newsletter signup.

```typescript
interface NewsletterFormProps {
  source: 'footer' | 'article' | 'thank-you';
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  buttonText?: string;
}
```

**Validation**:
- Email format validation
- Duplicate subscription handling
- GDPR compliance checkbox
- Loading states during submission

### ContactForm

**Purpose**: General contact form for inquiries and feedback.

```typescript
interface ContactFormProps {
  subject?: string;
  onSubmit: (data: ContactFormData) => Promise<void>;
  requiredFields?: string[];
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string;
}
```

## Utility Components

### LoadingSpinner

**Purpose**: Loading indicator for async operations.

```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}
```

### ErrorBoundary

**Purpose**: Catch and display JavaScript errors gracefully.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

### ImageOptimized

**Purpose**: Responsive images with lazy loading and optimization.

```typescript
interface ImageOptimizedProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}
```

**Features**:
- WebP/AVIF format support
- Lazy loading with intersection observer
- Responsive srcset generation
- Blur-up placeholder effect

## Styling Guidelines

### CSS Classes

**Component-specific classes**:
```css
/* Mars Globe */
.mars-globe {
  @apply w-full h-screen relative overflow-hidden;
}

.mars-globe__canvas {
  @apply absolute inset-0;
}

.mars-globe__loading {
  @apply absolute inset-0 flex items-center justify-center bg-black/50;
}

/* Info Panel */
.info-panel {
  @apply absolute right-4 top-1/2 transform -translate-y-1/2;
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl;
  @apply w-80 max-w-sm p-6 border border-gray-200 dark:border-gray-700;
}

.info-panel--hidden {
  @apply translate-x-full opacity-0 pointer-events-none;
}

/* Article Layout */
.article-layout {
  @apply max-w-4xl mx-auto px-4 py-8;
}

.article-content {
  @apply prose prose-slate dark:prose-invert max-w-none;
  @apply prose-headings:font-display prose-headings:text-mars-red;
}
```

**Theme Variables**:
```css
:root {
  /* Mars Color Palette */
  --color-mars-red: #cd5c5c;
  --color-mars-orange: #ff8c42;
  --color-mars-brown: #8b4513;
  --color-mars-tan: #deb887;
  
  /* Gwern-inspired Typography */
  --font-display: 'Inter', sans-serif;
  --font-body: 'ET Book', 'Georgia', serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;
}
```

## Performance Considerations

### Code Splitting
```typescript
// Lazy load heavy components
const MarsGlobe = lazy(() => import('./MarsGlobe'));
const SearchBox = lazy(() => import('./SearchBox'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <MarsGlobe locations={locations} />
</Suspense>
```

### Bundle Optimization
- Tree-shake unused Three.js modules
- Lazy load texture assets
- Use React.memo for expensive components
- Implement virtualization for large lists

### Accessibility Requirements

**Keyboard Navigation**:
- Tab order follows logical flow
- Globe hotspots accessible via arrow keys
- Modal dialogs trap focus
- Skip links for main content

**Screen Reader Support**:
- Proper heading hierarchy (h1-h6)
- Alt text for all images
- ARIA labels for interactive elements
- Status announcements for dynamic content

**Visual Accessibility**:
- Color contrast ratio ≥ 4.5:1
- Focus indicators visible
- Text scalable to 200%
- Reduced motion preferences respected

## Testing Strategy

### Unit Tests
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { InfoPanel } from './InfoPanel';

test('displays location information', () => {
  const location = mockLocationData;
  render(<InfoPanel location={location} isVisible={true} />);
  
  expect(screen.getByText(location.name)).toBeInTheDocument();
  expect(screen.getByText(`${location.elevation}m`)).toBeInTheDocument();
});
```

### Integration Tests
```typescript
// Globe interaction testing
test('user can select location on globe', async () => {
  const handleLocationSelect = jest.fn();
  render(<MarsGlobe locations={mockLocations} onLocationSelect={handleLocationSelect} />);
  
  // Wait for globe to load
  await waitFor(() => screen.getByTestId('mars-globe'));
  
  // Simulate clicking on location marker
  fireEvent.click(screen.getByTestId('location-olympus-mons'));
  
  expect(handleLocationSelect).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'olympus-mons' })
  );
});
```

### Visual Regression Tests
```typescript
// Storybook + Chromatic for visual testing
export default {
  title: 'Components/InfoPanel',
  component: InfoPanel,
};

export const Default = () => (
  <InfoPanel location={mockLocationData} isVisible={true} />
);

export const Loading = () => (
  <InfoPanel location={null} isVisible={true} />
);
```

## Error Handling

### Component Error Boundaries
```typescript
class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Globe component error:', error, errorInfo);
    // Report to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <GlobeFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Graceful Degradation
- WebGL fallback to 2D canvas
- Progressive enhancement for advanced features
- Offline functionality with service worker
- Mobile-optimized interactions