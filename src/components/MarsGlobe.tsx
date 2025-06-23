import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MarsLocation, GlobeProps } from '../types';

interface GlobeProps {
  locations: MarsLocation[];
  onLocationSelect: (location: MarsLocation) => void;
  onLocationHover: (location: MarsLocation | null) => void;
  selectedLocation?: MarsLocation;
  className?: string;
}

interface MarsSphereProps {
  locations: MarsLocation[];
  onLocationSelect: (location: MarsLocation) => void;
  onLocationHover: (location: MarsLocation | null) => void;
  selectedLocation?: MarsLocation;
}

// Convert lat/lng to 3D coordinates on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Location marker component
const LocationMarker: React.FC<{
  location: MarsLocation;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  isSelected: boolean;
}> = ({ location, onSelect, onHover, isSelected }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const position = useMemo(() => 
    latLngToVector3(location.coordinates.lat, location.coordinates.lng, 1.01),
    [location.coordinates]
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onSelect}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(false);
        }}
      >
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial 
          color={isSelected ? '#f59e0b' : hovered ? '#ef4444' : '#fbbf24'} 
          transparent
          opacity={hovered || isSelected ? 1 : 0.8}
        />
      </mesh>
      
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.05, 0]}
          center
          distanceFactor={10}
          occlude={false}
        >
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
            <div className="font-semibold">{location.name}</div>
            <div className="text-gray-300">{location.elevation}m elevation</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Main Mars sphere component
const MarsSphere: React.FC<MarsSphereProps> = ({ 
  locations, 
  onLocationSelect, 
  onLocationHover,
  selectedLocation 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hoverLocation, setHoverLocation] = useState<MarsLocation | null>(null);
  const { camera, mouse } = useThree();

  // Load Mars texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/Mars_surface_data/5672_mars_6k_color.jpg',
      (loadedTexture) => {
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.warn('Failed to load Mars texture:', error);
      }
    );
  }, []);

  // Rotate based on mouse position
  useFrame((state) => {
    if (meshRef.current) {
      const mouseInfluence = 0.1;
      meshRef.current.rotation.y += 0.001; // Slow auto-rotation
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        mouse.y * mouseInfluence,
        0.02
      );
      meshRef.current.rotation.y += mouse.x * mouseInfluence * 0.01;
    }
  });

  const handleLocationHover = (location: MarsLocation | null) => {
    setHoverLocation(location);
    onLocationHover(location);
  };

  return (
    <group>
      <Sphere ref={meshRef} args={[1, 64, 32]}>
        <meshPhongMaterial 
          map={texture}
          shininess={0}
          transparent
          opacity={0.95}
        />
      </Sphere>
      
      {/* Location markers */}
      {locations.map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          onSelect={() => onLocationSelect(location)}
          onHover={(hovered) => handleLocationHover(hovered ? location : null)}
          isSelected={selectedLocation?.id === location.id}
        />
      ))}
      
      {/* Atmospheric glow */}
      <Sphere args={[1.02, 32, 16]}>
        <meshBasicMaterial
          color="#ff6b3d"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
};

// Error boundary component
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mars-900 to-mars-950">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">🔴</div>
      <h3 className="text-xl font-semibold text-white mb-2">
        3D Globe Unavailable
      </h3>
      <p className="text-gray-300 mb-4">
        WebGL is not supported or failed to load
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-mars-600 text-white rounded hover:bg-mars-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

// Main Mars Globe component with error handling
const MarsGlobe: React.FC<GlobeProps> = ({ 
  locations, 
  onLocationSelect, 
  onLocationHover,
  selectedLocation,
  className = "" 
}) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch (e) {
      setHasWebGL(false);
      setError(e as Error);
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div className={`${className} w-full h-full`}>
        <ErrorFallback error={error || undefined} />
      </div>
    );
  }

  return (
    <div className={`${className} w-full h-full`}>
      <Canvas
        camera={{ 
          position: [0, 0, 2.5], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setError(error);
          setHasWebGL(false);
        }}
      >
        <color attach="background" args={['#0a0a0a']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          color="#ffffff"
        />
        <pointLight
          position={[-5, -5, -5]}
          intensity={0.3}
          color="#ff6b3d"
        />
        
        {/* Mars sphere with locations */}
        <MarsSphere
          locations={locations}
          onLocationSelect={onLocationSelect}
          onLocationHover={onLocationHover}
          selectedLocation={selectedLocation}
        />
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={5}
          autoRotate={false}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
};

export default MarsGlobe;