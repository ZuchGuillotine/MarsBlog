import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import { Vector3, Raycaster } from 'three';
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
  isHovered = false 
}: LocationMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Convert lat/lng to 3D position on sphere surface
  const position = coordinatesToPosition3D(
    location.coordinates.lat, 
    location.coordinates.lng, 
    2.05 // Slightly above Mars surface
  );

  // Animate marker
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(isSelected || hovered ? scale * 1.5 : scale);
    }
  });

  const handlePointerEnter = () => {
    setHovered(true);
    onHover?.(location);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    setHovered(false);
    onHover?.(null);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect?.(location);
  };

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Marker Sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        scale={isSelected ? 1.5 : 1}
      >
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#ff8c42' : hovered ? '#cd5c5c' : '#ffffff'}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Glow Effect */}
      <mesh
        scale={isSelected ? 2 : hovered ? 1.5 : 1}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#ff8c42' : '#cd5c5c'}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Label */}
      {(hovered || isSelected) && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <Html
            center
            distanceFactor={10}
            position={[0, 0.1, 0]}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div className="bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-md text-sm font-display whitespace-nowrap">
              {location.name}
              <div className="text-xs text-gray-300">
                {location.elevation.toLocaleString()}m
              </div>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}

// Main Location Markers Component
export default function LocationMarkers({ 
  locations, 
  onSelect, 
  onHover, 
  selectedLocation 
}: LocationMarkersProps) {
  return (
    <>
      {locations.map((location) => (
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