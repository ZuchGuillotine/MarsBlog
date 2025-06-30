import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
} from '@react-three/drei';
import { Mesh, WebGLRenderer, RepeatWrapping, Group } from 'three';
import type { LocationData } from '../../types/location';
import type { LocationMarkersRef } from './LocationMarkers';
import LocationMarkers from './LocationMarkers';
import marsLocations from '../../data/marsLocations';

interface MarsGlobeProps {
  locations?: LocationData[];
  onLocationSelect?: (location: LocationData | null) => void;
  onLocationHover?: (location: LocationData | null) => void;
  className?: string;
  autoRotate?: boolean;
  showMarkers?: boolean;
}

// Mars Planet Component with Markers
function Planet({
  locations,
  onLocationSelect,
  onLocationHover,
  locationMarkersRef,
}: {
  locations: LocationData[];
  onLocationSelect?: (location: LocationData | null) => void;
  onLocationHover?: (location: LocationData | null) => void;
  locationMarkersRef?: React.RefObject<LocationMarkersRef | null>;
}) {
  const groupRef = useRef<Group>(null);

  // Load Mars textures with error handling
  const [colorMap, normalMap, roughnessMap] = useTexture(
    [
      '/Mars_surface_data/5672_mars_6k_color.jpg',
      '/Mars_surface_data/marsgeology.jpg', // Using geology as normal map
      '/Mars_surface_data/mars_mola_roughness.png',
    ],
    textures => {
      console.log('Mars textures loaded successfully:', textures.length);
      // Ensure textures are properly configured
      textures.forEach((texture, index) => {
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.flipY = false; // Important for Mars textures
        console.log(`Texture ${index} configured:`, texture);
      });
    }
  );

  // Auto-rotate the planet and markers together
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05; // Slower rotation for better viewing
    }
  });

  console.log('Mars Planet component rendering...');

  return (
    <group ref={groupRef}>
      {/* Mars Sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          roughness={0.8}
          metalness={0.1}
          normalScale={[0.3, 0.3]}
        />
      </mesh>

      {/* Location Markers - now part of the rotating group */}
      <LocationMarkers
        ref={locationMarkersRef}
        locations={locations}
        onSelect={onLocationSelect}
        onHover={onLocationHover}
        selectedLocation={null}
      />
    </group>
  );
}

// Simple Loading Component
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="loading-spinner w-8 h-8"></div>
        <p className="text-white font-display">Loading Mars...</p>
      </div>
    </div>
  );
}

// Scene Component with lighting and environment
function Scene({
  locations,
  onLocationSelect,
  onLocationHover,
  autoRotate = false,
  locationMarkersRef,
}: {
  locations: LocationData[];
  onLocationSelect?: (location: LocationData | null) => void;
  onLocationHover?: (location: LocationData | null) => void;
  autoRotate?: boolean;
  locationMarkersRef?: React.RefObject<LocationMarkersRef | null>;
}) {
  console.log(
    'Mars Scene component rendering with',
    locations?.length,
    'locations'
  );

  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <directionalLight position={[-10, -10, -5]} intensity={0.6} />
      <pointLight position={[0, 0, 10]} intensity={0.3} />

      {/* Mars Planet */}
      <Planet
        locations={locations}
        onLocationSelect={onLocationSelect}
        onLocationHover={onLocationHover}
        locationMarkersRef={locationMarkersRef}
      />

      {/* Enhanced Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={4}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping={true}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
      />

      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={50} />
    </>
  );
}

// Main Mars Globe Component
export default function MarsGlobe({
  locations = marsLocations,
  onLocationSelect,
  onLocationHover,
  className = '',
  autoRotate = false,
  showMarkers = true,
}: MarsGlobeProps) {
  console.log(
    'MarsGlobe component mounting with',
    locations?.length,
    'locations'
  );

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [hoveredLocation, setHoveredLocation] = useState<LocationData | null>(
    null
  );
  const locationMarkersRef = useRef<LocationMarkersRef>(null);

  const handleCreated = ({ gl }: { gl: WebGLRenderer }) => {
    console.log('WebGL context created in Mars globe');
    gl.setClearColor('#000011');
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const handleLocationSelect = (location: LocationData | null) => {
    setSelectedLocation(location);
    onLocationSelect?.(location);
  };

  const handleLocationHover = (location: LocationData | null) => {
    setHoveredLocation(location);
    onLocationHover?.(location);
  };

  return (
    <div className={`w-full h-full relative ${className}`}>
      <Canvas
        onCreated={handleCreated}
        className="w-full h-full"
        onPointerMissed={() => {
          // Deselect location and dismiss cards when clicking empty space
          handleLocationSelect(null);
          handleLocationHover(null);
          locationMarkersRef.current?.dismissCard();
        }}
      >
        <Suspense fallback={null}>
          <Scene
            locations={showMarkers ? locations : []}
            onLocationSelect={handleLocationSelect}
            onLocationHover={handleLocationHover}
            autoRotate={autoRotate}
            locationMarkersRef={locationMarkersRef}
          />
        </Suspense>
      </Canvas>

      {/* Attribution */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-2 text-white text-xs">
          Mars imagery: NASA/JPL
        </div>
      </div>

      {/* Location Info Panel */}
      {selectedLocation && (
        <div className="absolute top-4 left-4 z-20 max-w-sm">
          <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg p-4 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-display font-semibold text-lg">
                {selectedLocation.name}
              </h3>
              <button
                onClick={() => handleLocationSelect(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-gray-300 text-sm leading-relaxed">
                {selectedLocation.description}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {selectedLocation.coordinates.lat.toFixed(1)}°N,{' '}
                  {selectedLocation.coordinates.lng.toFixed(1)}°E
                </span>
                <span className="text-gray-400">
                  {selectedLocation.elevation.toLocaleString()}m elevation
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-xs">
                  Terraforming Potential:
                </span>
                <div className="flex space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < selectedLocation.terraformingPotential.rating
                          ? 'bg-green-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-green-400 text-xs font-medium">
                  {selectedLocation.terraformingPotential.rating}/10
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug info */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
        Mars Globe - {locations?.length || 0} locations
        {hoveredLocation && (
          <div className="mt-1 text-gray-300">
            Hovering: {hoveredLocation.name}
          </div>
        )}
      </div>
    </div>
  );
}
