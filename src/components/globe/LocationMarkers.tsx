import { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { Vector3, Raycaster, Color, Mesh, MeshBasicMaterial } from 'three';
import type { LocationData } from '../../types/location';
import { coordinatesToPosition3D } from '../../utils/coordinates';

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
}

// Individual Location Marker Component
function LocationMarker({
  location,
  onSelect,
  onHover,
  isSelected = false,
  isHovered = false,
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

  const markerColor = getMarkerColor();

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Glow Effect - subtle and small */}
      <mesh
        ref={glowRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
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
      >
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color={markerColor} transparent opacity={1} />
      </mesh>

      {/* Interactive Card - ONLY on hover */}
      {hovered && (
        <Html
          center
          distanceFactor={10}
          position={[0, 0.03, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            fontSize: '10px', // Even smaller base font size
          }}
        >
          <div
            className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded p-1.5 shadow-xl"
            style={{
              minWidth: '140px',
              maxWidth: '180px',
              fontSize: '9px', // Tiny font for minimal intrusion
            }}
          >
            {/* Location Name */}
            <h3
              className="text-white font-semibold leading-tight mb-0.5"
              style={{ fontSize: '10px' }}
            >
              {location.name}
            </h3>

            {/* Coordinates & Rating on same line */}
            <div
              className="flex items-center justify-between mb-0.5"
              style={{ fontSize: '8px' }}
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
              className="text-gray-300 leading-tight"
              style={{ fontSize: '8px' }}
            >
              {location.description.length > 60
                ? location.description.substring(0, 60) + '...'
                : location.description}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

// Main Location Markers Component
export default function LocationMarkers({
  locations,
  onSelect,
  onHover,
  selectedLocation,
}: LocationMarkersProps) {
  return (
    <>
      {locations.map(location => (
        <LocationMarker
          key={location.id}
          location={location}
          onSelect={onSelect}
          onHover={onHover}
          isSelected={selectedLocation?.id === location.id}
        />
      ))}
    </>
  );
}
