import { useState, useEffect } from 'react';
import MarsGlobe from './globe/MarsGlobe';
import type { LocationData } from '../types/location';

interface MarsGlobeWrapperProps {
  locations: LocationData[];
}

export default function MarsGlobeWrapper({ locations }: MarsGlobeWrapperProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [hoveredLocation, setHoveredLocation] = useState<LocationData | null>(
    null
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('MarsGlobeWrapper mounted with', locations.length, 'locations');
    // Simulate loading delay for better UX
    const timer = setTimeout(() => {
      console.log('MarsGlobeWrapper loading complete');
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [locations]);

  const handleLocationSelect = (location: LocationData | null) => {
    setSelectedLocation(location);
    if (location) {
      console.log('Selected location:', location.name);
    }
  };

  const handleLocationHover = (location: LocationData | null) => {
    setHoveredLocation(location);
    if (location) {
      console.log('Hovered location:', location.name);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="w-96 h-96 bg-mars-gradient rounded-full animate-pulse opacity-30 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="loading-spinner w-8 h-8"></div>
              <p className="text-white font-display">
                Initializing Mars Globe...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <MarsGlobe
        locations={locations}
        onLocationSelect={handleLocationSelect}
        onLocationHover={handleLocationHover}
        autoRotate={false}
        showMarkers={true}
        className="w-full h-full"
      />

      {/* Debug info - remove in production */}
      {(selectedLocation || hoveredLocation) && (
        <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm">
          {selectedLocation && (
            <div className="mb-2">
              <strong>Selected:</strong> {selectedLocation.name}
              <br />
              <small>
                {selectedLocation.coordinates.lat.toFixed(2)}°,{' '}
                {selectedLocation.coordinates.lng.toFixed(2)}°
              </small>
            </div>
          )}
          {hoveredLocation && hoveredLocation !== selectedLocation && (
            <div>
              <strong>Hovering:</strong> {hoveredLocation.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
