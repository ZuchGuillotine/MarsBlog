// Location data structure for Mars features
export interface LocationData {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevation: number;
  description: string;
  terraformingPotential: {
    rating: number; // 0-10 scale
    factors: string[];
  };
  relatedArticles: string[];
  type?: 'volcano' | 'canyon' | 'plain' | 'crater' | 'polar' | 'mountain' | 'valley';
  discoveredBy?: string;
  discoveryDate?: string;
  significance?: string;
  size?: {
    diameter?: number;
    length?: number;
    width?: number;
    depth?: number;
  };
}

// Globe state management
export interface GlobeState {
  selectedLocation: LocationData | null;
  hoveredLocation: LocationData | null;
  isLoading: boolean;
  cameraPosition: [number, number, number];
  globeRotation: [number, number, number];
}

// Search result structure
export interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: 'article' | 'location' | 'page';
  score: number;
}

// Article frontmatter structure
export interface ArticleFrontmatter {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  tags: string[];
  readingTime?: number;
  lastModified?: Date;
  ogImage?: string;
  featured?: boolean;
}

// Article metadata for listings
export interface ArticleMeta {
  slug: string;
  frontmatter: ArticleFrontmatter;
  excerpt: string;
}

// Contact form data
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string;
}

// Donation session data
export interface DonationSessionData {
  sessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  timestamp: Date;
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  webglSupported: boolean;
  devicePixelRatio: number;
  memoryUsage?: number;
}

// Mars terrain data
export interface TerrainData {
  elevation: number[][];
  textureUrl: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  resolution: number;
}

// Camera control configuration
export interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

// Three.js material configuration
export interface MaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
  emissive: string;
  emissiveIntensity: number;
  bumpScale?: number;
  normalScale?: [number, number];
}

// Animation configuration
export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  loop?: boolean;
  autoStart?: boolean;
}

// Interaction event data
export interface InteractionEvent {
  type: 'click' | 'hover' | 'drag' | 'zoom';
  location?: LocationData;
  position: {
    x: number;
    y: number;
  };
  timestamp: Date;
}

// WebGL capabilities
export interface WebGLCapabilities {
  supported: boolean;
  version: string;
  renderer: string;
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  extensions: string[];
}

// Error tracking
export interface ErrorData {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
}

// Theme configuration
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

// Navigation structure
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
  children?: NavigationItem[];
}

// Site configuration
export interface SiteConfig {
  title: string;
  description: string;
  url: string;
  author: {
    name: string;
    email: string;
    url: string;
  };
  social: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  analytics: {
    plausibleDomain?: string;
    gtmId?: string;
  };
  stripe: {
    publicKey: string;
    priceIds: {
      small: string;
      medium: string;
      large: string;
    };
  };
}

export default LocationData;