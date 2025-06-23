export interface MarsLocation {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevation: number;
  description: string;
  terraformingRationale: string;
  externalLinks: {
    title: string;
    url: string;
  }[];
  blogSlug?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishDate: Date;
  author: string;
  tags: string[];
  category: string;
  readingTime: number;
  featured?: boolean;
}

export interface SearchResult {
  ref: string;
  score: number;
  title: string;
  description: string;
  url: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  donationTiers: {
    amount: number;
    label: string;
    description: string;
  }[];
}

export interface GlobeProps {
  locations: MarsLocation[];
  onLocationSelect: (location: MarsLocation) => void;
  onLocationHover: (location: MarsLocation | null) => void;
  selectedLocation?: MarsLocation;
  className?: string;
}

export interface LocationPanelProps {
  location: MarsLocation | null;
  isVisible: boolean;
  onClose: () => void;
}