export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TerraformingPotential {
  rating: number; // 1-10 scale
  factors: string[];
  challenges: string[];
}

export interface LocationData {
  id: string;
  name: string;
  coordinates: Coordinates;
  elevation: number; // meters
  description: string;
  terraformingPotential: TerraformingPotential;
  relatedArticles: string[];
  externalLinks?: {
    title: string;
    url: string;
    type: 'research' | 'nasa' | 'wiki' | 'other';
  }[];
  images?: {
    thumbnail: string;
    full: string;
    alt: string;
  }[];
}

export interface LocationMarkerProps {
  location: LocationData;
  onHover: (location: LocationData | null) => void;
  onSelect: (location: LocationData) => void;
  isSelected?: boolean;
  isHovered?: boolean;
}

// 3D position for Three.js
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface GlobeState {
  selectedLocation: LocationData | null;
  hoveredLocation: LocationData | null;
  isLoading: boolean;
  cameraPosition: [number, number, number];
  globeRotation: [number, number, number];
}