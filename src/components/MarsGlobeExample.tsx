import React, { useState, useEffect, useCallback } from 'react';
import { MarsGlobe } from './MarsGlobe';
import { marsLocations } from '../data/marsLocations';
import { PerformanceMonitor, AdaptiveQuality } from '../utils/performance';
import type { LocationData } from '../types/mars';

/**
 * Example usage component demonstrating the Mars Globe integration
 * This component shows how to integrate the Mars Globe into an Astro page
 */

interface MarsGlobeExampleProps {
  className?: string;
  autoStart?: boolean;
}

export const MarsGlobeExample: React.FC<MarsGlobeExampleProps> = ({
  className = '',
  autoStart = true
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Initialize performance monitoring
  useEffect(() => {
    if (autoStart) {
      PerformanceMonitor.startLoadTimer();
    }

    // Listen for quality changes
    const handleQualityChange = (event: CustomEvent) => {
      setQuality(event.detail.quality);
    };

    window.addEventListener('qualityChange', handleQualityChange as EventListener);

    return () => {
      window.removeEventListener('qualityChange', handleQualityChange as EventListener);
    };
  }, [autoStart]);

  // Handle location selection
  const handleLocationSelect = useCallback((location: LocationData) => {
    setSelectedLocation(location);
    
    // Log interaction for analytics
    console.log('Location selected:', location.name);
    
    // Example: Send analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'location_select', {
        location_name: location.name,
        location_type: location.type,
        terraforming_rating: location.terraformingPotential.rating
      });
    }
  }, []);

  // Handle location hover
  const handleLocationHover = useCallback((location: LocationData | null) => {
    setHoveredLocation(location);
  }, []);

  // Handle loading state
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    PerformanceMonitor.endLoadTimer();
    
    // Log performance metrics
    setTimeout(() => {
      PerformanceMonitor.logMetrics();
    }, 1000);
  }, []);

  // Handle article navigation
  const handleReadMore = useCallback((articleSlug: string) => {
    // Example: Navigate to article page
    // In a real Astro app, you might use the router or window.location
    const articleUrl = `/explore/${articleSlug}`;
    
    console.log('Navigate to article:', articleUrl);
    
    // For demo purposes, we'll just log the action
    // In a real app: window.location.href = articleUrl;
    
    // Send analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'article_click', {
        article_slug: articleSlug,
        source: 'mars_globe'
      });
    }
  }, []);

  // Toggle stats display
  const toggleStats = useCallback(() => {
    setShowStats(prev => !prev);
  }, []);

  // Get current quality settings
  const qualitySettings = AdaptiveQuality.getQualitySettings();

  return (
    <div className={`mars-globe-example relative ${className}`}>
      {/* Main Mars Globe */}
      <MarsGlobe
        locations={marsLocations}
        onLocationSelect={handleLocationSelect}
        onLocationHover={handleLocationHover}
        loading={isLoading}
        className="w-full h-screen"
      />

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 space-y-2 z-30">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
          <h3 className="text-lg font-bold mb-2">Mars Explorer</h3>
          <div className="space-y-1 text-sm">
            <div>Locations: {marsLocations.length}</div>
            <div>Quality: {quality}</div>
            {hoveredLocation && (
              <div className="text-blue-300">
                Hovering: {hoveredLocation.name}
              </div>
            )}
          </div>
        </div>

        {/* Quality indicator */}
        <div className={`
          px-2 py-1 rounded text-xs font-medium
          ${quality === 'high' ? 'bg-green-600' : quality === 'medium' ? 'bg-yellow-600' : 'bg-red-600'}
          text-white
        `}>
          {quality.toUpperCase()} QUALITY
        </div>

        {/* Stats toggle */}
        <button
          onClick={toggleStats}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>

      {/* Performance stats */}
      {showStats && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm font-mono z-30">
          <h4 className="font-bold mb-2">Performance Stats</h4>
          <div className="space-y-1">
            <div>Segments: {qualitySettings.sphereSegments}</div>
            <div>Shadows: {qualitySettings.enableShadows ? 'ON' : 'OFF'}</div>
            <div>Post-FX: {qualitySettings.enablePostProcessing ? 'ON' : 'OFF'}</div>
            <div>Texture: {qualitySettings.textureSize}px</div>
            <div>Markers: {qualitySettings.maxMarkers}</div>
          </div>
        </div>
      )}

      {/* Location quick access */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Quick Access</h4>
          <div className="flex flex-wrap gap-2">
            {marsLocations.slice(0, 6).map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className={`
                  px-3 py-2 rounded-full text-sm font-medium transition-colors
                  ${selectedLocation?.id === location.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                  }
                `}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
            <div className="text-xl font-bold mb-2">Exploring Mars</div>
            <div className="text-gray-300">Loading the Red Planet...</div>
          </div>
        </div>
      )}

      {/* Help tooltip */}
      <div className="absolute bottom-4 right-4 z-30">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
          <div className="font-medium mb-1">Controls:</div>
          <div className="space-y-1 text-xs">
            <div>• Drag to rotate</div>
            <div>• Scroll to zoom</div>
            <div>• Click markers for details</div>
            <div>• Arrow keys to navigate</div>
            <div>• Space to reset view</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarsGlobeExample;