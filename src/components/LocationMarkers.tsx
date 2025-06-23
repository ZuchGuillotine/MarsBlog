import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, Vector3, Raycaster, Color, MathUtils } from 'three';
import * as THREE from 'three';
import type { LocationData } from '../types/mars';

interface LocationMarkersProps {
  locations: LocationData[];
  onLocationClick: (location: LocationData) => void;
  onLocationHover: (location: LocationData | null) => void;
  selectedLocation?: string;
  planetRadius: number;
  markerScale?: number;
}

interface MarkerProps {
  location: LocationData;
  planetRadius: number;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

const LocationMarker: React.FC<MarkerProps> = ({
  location,
  planetRadius,
  isSelected,
  isHovered,
  scale,
  onClick,
  onHover
}) => {
  const markerRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  // Convert lat/lng to 3D coordinates on sphere
  const position = useMemo(() => {
    const phi = (90 - location.coordinates.lat) * (Math.PI / 180);
    const theta = (location.coordinates.lng + 180) * (Math.PI / 180);
    
    const x = -(planetRadius * Math.sin(phi) * Math.cos(theta));
    const y = planetRadius * Math.cos(phi);
    const z = planetRadius * Math.sin(phi) * Math.sin(theta);
    
    return new Vector3(x, y, z);
  }, [location.coordinates, planetRadius]);

  // Color coding based on terraforming potential
  const markerColor = useMemo(() => {
    const rating = location.terraformingPotential.rating;
    if (rating >= 8) return new Color(0x00ff00); // High potential - Green
    if (rating >= 6) return new Color(0xffff00); // Medium potential - Yellow
    if (rating >= 4) return new Color(0xff8800); // Low potential - Orange
    return new Color(0xff0000); // Very low potential - Red
  }, [location.terraformingPotential.rating]);

  // Animation loop
  useFrame((state) => {
    if (!markerRef.current || !ringRef.current || !glowRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Pulsing animation
    const pulseScale = 1 + Math.sin(time * 3) * 0.2;
    const baseScale = scale * (isHovered ? 1.5 : 1) * (isSelected ? 1.3 : 1);
    
    markerRef.current.scale.setScalar(baseScale * pulseScale);
    
    // Ring animation
    ringRef.current.rotation.z += 0.02;
    ringRef.current.scale.setScalar(baseScale * 1.5);
    
    // Glow effect
    const glowIntensity = 0.5 + Math.sin(time * 2) * 0.3;
    const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial;
    glowMaterial.opacity = glowIntensity * (isHovered ? 0.8 : 0.4) * (isSelected ? 1 : 0.6);
    
    // Billboard effect - make markers always face camera
    markerRef.current.lookAt(state.camera.position);
    ringRef.current.lookAt(state.camera.position);
    glowRef.current.lookAt(state.camera.position);
  });

  return (
    <group position={position}>
      {/* Main marker */}
      <mesh
        ref={markerRef}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        onPointerEnter={(event) => {
          event.stopPropagation();
          onHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={(event) => {
          event.stopPropagation();
          onHover(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerColor}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Selection ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={isSelected ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef} scale={2}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Elevation indicator (thin line from surface to marker) */}
      {location.elevation > 1000 && (
        <mesh position={[0, 0, -0.02]}>
          <cylinderGeometry args={[0.002, 0.002, Math.min(location.elevation / 10000, 0.5)]} />
          <meshBasicMaterial
            color={markerColor}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
};

export const LocationMarkers: React.FC<LocationMarkersProps> = ({
  locations,
  onLocationClick,
  onLocationHover,
  selectedLocation,
  planetRadius,
  markerScale = 1
}) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const { raycaster, camera, mouse } = useThree();

  const handleMarkerClick = useCallback((location: LocationData) => {
    onLocationClick(location);
  }, [onLocationClick]);

  const handleMarkerHover = useCallback((location: LocationData, hovered: boolean) => {
    if (hovered) {
      setHoveredLocation(location.id);
      onLocationHover(location);
    } else {
      setHoveredLocation(null);
      onLocationHover(null);
    }
  }, [onLocationHover]);

  // Render all location markers
  return (
    <group>
      {locations.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          planetRadius={planetRadius}
          isSelected={selectedLocation === location.id}
          isHovered={hoveredLocation === location.id}
          scale={markerScale}
          onClick={() => handleMarkerClick(location)}
          onHover={(hovered) => handleMarkerHover(location, hovered)}
        />
      ))}

      {/* Label rendering for hovered/selected locations */}
      {(hoveredLocation || selectedLocation) && (
        <LocationLabel
          location={locations.find(l => l.id === (hoveredLocation || selectedLocation))!}
          planetRadius={planetRadius}
          isSelected={!!selectedLocation}
        />
      )}
    </group>
  );
};

// Floating label component
interface LocationLabelProps {
  location: LocationData;
  planetRadius: number;
  isSelected: boolean;
}

const LocationLabel: React.FC<LocationLabelProps> = ({
  location,
  planetRadius,
  isSelected
}) => {
  const labelRef = useRef<Mesh>(null);
  const { camera } = useThree();

  // Convert lat/lng to 3D coordinates
  const position = useMemo(() => {
    const phi = (90 - location.coordinates.lat) * (Math.PI / 180);
    const theta = (location.coordinates.lng + 180) * (Math.PI / 180);
    
    const x = -(planetRadius * 1.3 * Math.sin(phi) * Math.cos(theta));
    const y = planetRadius * 1.3 * Math.cos(phi);
    const z = planetRadius * 1.3 * Math.sin(phi) * Math.sin(theta);
    
    return new Vector3(x, y, z);
  }, [location.coordinates, planetRadius]);

  useFrame(() => {
    if (labelRef.current) {
      labelRef.current.lookAt(camera.position);
    }
  });

  // Create canvas texture for label
  const labelTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.width = 512;
    canvas.height = 128;
    
    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();
    
    // Border
    context.strokeStyle = '#ff6b35';
    context.lineWidth = 2;
    context.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 8);
    context.stroke();
    
    // Text
    context.fillStyle = '#ffffff';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(location.name, canvas.width / 2, 45);
    
    // Coordinates
    context.font = '20px Arial';
    context.fillStyle = '#cccccc';
    const coordText = `${location.coordinates.lat.toFixed(1)}°, ${location.coordinates.lng.toFixed(1)}°`;
    context.fillText(coordText, canvas.width / 2, 75);
    
    // Elevation
    context.fillStyle = '#ff6b35';
    const elevText = `${location.elevation}m elevation`;
    context.fillText(elevText, canvas.width / 2, 100);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }, [location]);

  return (
    <mesh ref={labelRef} position={position}>
      <planeGeometry args={[2, 0.5]} />
      <meshBasicMaterial
        map={labelTexture}
        transparent
        opacity={isSelected ? 1 : 0.9}
        depthTest={false}
      />
    </mesh>
  );
};

export default LocationMarkers;