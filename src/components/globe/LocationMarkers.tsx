import {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { Vector3, Raycaster, Color, Mesh, MeshBasicMaterial } from 'three';
import type { LocationData } from '../../types/location';
import { coordinatesToPosition3D } from '../../utils/coordinates';

export interface LocationMarkersRef {
  dismissCard: () => void;
}

interface LocationMarkersProps {
  locations: LocationData[];
  onSelect?: (location: LocationData) => void;
  onHover?: (location: LocationData | null) => void;
  selectedLocation?: LocationData | null;
}

interface LocationMarkerProps {
  location: LocationData;
  onSelect?: (location: LocationData) => void;
  onHover?: (location: LocationData | null) => void;
  isSelected?: boolean;
  isHovered?: boolean;
  showCard?: boolean;
  onCardDismiss?: () => void;
}

// Individual Location Marker Component
function LocationMarker({
  location,
  onSelect,
  onHover,
  isSelected = false,
  isHovered = false,
  showCard = false,
  onCardDismiss,
}: LocationMarkerProps) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Convert lat/lng to 3D position on sphere surface
  const position = coordinatesToPosition3D(
    location.coordinates.lat,
    location.coordinates.lng,
    1.01 // Slightly above Mars surface
  );

  // Get marker color based on terraforming potential
  const getMarkerColor = useCallback(() => {
    const rating = location.terraformingPotential.rating;
    if (isSelected) return '#ffffff'; // White for selected
    if (hovered || isHovered) return '#ffcc00'; // Gold for hover
    if (rating >= 9) return '#4ade80'; // Green for high potential
    if (rating >= 7) return '#fbbf24'; // Yellow for medium-high
    if (rating >= 5) return '#f97316'; // Orange for medium
    return '#6b7280'; // Gray for low potential
  }, [location.terraformingPotential.rating, isSelected, hovered, isHovered]);

  // Animate marker
  useFrame(state => {
    if (meshRef.current && glowRef.current) {
      const time = state.clock.elapsedTime;

      // Only pulse if selected or hovered
      if (isSelected || hovered) {
        const pulseScale = 1 + Math.sin(time * 4) * 0.2;
        meshRef.current.scale.setScalar(pulseScale);
        glowRef.current.scale.setScalar(pulseScale * 1.5);
      } else {
        meshRef.current.scale.setScalar(1);
        glowRef.current.scale.setScalar(1.2);
      }
    }
  });

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    onHover?.(location);
    document.body.style.cursor = 'pointer';
  }, [location, onHover]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    onHover?.(null);
    document.body.style.cursor = 'default';
  }, [onHover]);

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      onSelect?.(location);
    },
    [location, onSelect]
  );

  // Handle double-click for direct navigation
  const handleDoubleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      window.location.href = `/locations/${location.id}`;
    },
    [location.id]
  );

  // Handle navigation to location page from card
  const handleLocationClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      e.preventDefault();
      window.location.href = `/locations/${location.id}`;
    },
    [location.id]
  );

  const markerColor = getMarkerColor();

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Glow Effect - subtle and small */}
      <mesh
        ref={glowRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.3} />
      </mesh>

      {/* Main Marker Sphere - small fixed size */}
      <mesh
        ref={meshRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color={markerColor} transparent opacity={1} />
      </mesh>

      {/* Interactive Card - Show on hover, persist until dismissed */}
      {(showCard || hovered) && (
        <Html
          center
          distanceFactor={5}
          position={[0, 0.03, 0]}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            transform: 'scale(0.8)',
            transformOrigin: 'center',
            fontSize: '14px',
          }}
        >
          <div
            className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded p-3 shadow-xl transition-all duration-200 relative"
            style={{
              minWidth: '180px',
              maxWidth: '220px',
              fontSize: '13px',
            }}
          >
            {/* Close Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                onCardDismiss?.();
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors duration-200 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-700/50"
              style={{ fontSize: '12px' }}
            >
              ×
            </button>

            {/* Location Name */}
            <h3
              className="text-white font-semibold leading-tight mb-1 pr-6"
              style={{ fontSize: '14px' }}
            >
              {location.name}
            </h3>

            {/* Coordinates & Rating on same line */}
            <div
              className="flex items-center justify-between mb-1"
              style={{ fontSize: '11px' }}
            >
              <span className="text-gray-400">
                {location.coordinates.lat.toFixed(1)}°
                {location.coordinates.lat >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(location.coordinates.lng).toFixed(1)}°
                {location.coordinates.lng >= 0 ? 'E' : 'W'}
              </span>
              <span className="text-green-400 font-medium">
                {location.terraformingPotential.rating}/10
              </span>
            </div>

            {/* Very brief description */}
            <p
              className="text-gray-300 leading-tight mb-2"
              style={{ fontSize: '11px' }}
            >
              {location.description.length > 60
                ? location.description.substring(0, 60) + '...'
                : location.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
              <button
                onClick={handleLocationClick}
                className="flex-1 text-sm text-blue-400 hover:text-blue-300 font-medium py-1 px-2 rounded hover:bg-blue-400/10 transition-colors duration-200"
              >
                Explore Details
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Main Location Markers Component
const LocationMarkers = forwardRef<LocationMarkersRef, LocationMarkersProps>(
  function LocationMarkers(
    { locations, onSelect, onHover, selectedLocation },
    ref
  ) {
    const [openCardId, setOpenCardId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleMarkerClick = useCallback(
      (location: LocationData) => {
        // Click behavior - can be used for selection or direct navigation
        onSelect?.(location);
      },
      [onSelect]
    );

    const handleMarkerHover = useCallback(
      (location: LocationData | null) => {
        setHoveredId(location?.id || null);
        if (location) {
          // Once hovered, persist the card
          setOpenCardId(location.id);
        }
        onHover?.(location);
      },
      [onHover]
    );

    const handleCardDismiss = useCallback(() => {
      setOpenCardId(null);
      setHoveredId(null);
    }, []);

    // Expose dismissCard function to parent
    useImperativeHandle(
      ref,
      () => ({
        dismissCard: handleCardDismiss,
      }),
      [handleCardDismiss]
    );

    return (
      <>
        {locations.map(location => (
          <LocationMarker
            key={location.id}
            location={location}
            onSelect={handleMarkerClick}
            onHover={handleMarkerHover}
            isSelected={selectedLocation?.id === location.id}
            isHovered={hoveredId === location.id}
            showCard={openCardId === location.id}
            onCardDismiss={handleCardDismiss}
          />
        ))}
      </>
    );
  }
);

export default LocationMarkers;
