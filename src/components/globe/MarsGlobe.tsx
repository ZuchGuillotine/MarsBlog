import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { LocationData } from '../../types/location';
import LocationMarkers from './LocationMarkers';

interface MarsGlobeProps {
  locations: LocationData[];
  onLocationSelect?: (location: LocationData) => void;
  onLocationHover?: (location: LocationData | null) => void;
  className?: string;
}

// Mars Planet Component
function Planet() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load Mars textures with error handling
  const [colorMap, normalMap, roughnessMap] = useTexture([
    '/mars-data/5672_mars_6k_color.jpg',
    '/mars-data/marsgeology.jpg', // Using geology as normal map
    '/mars-data/mars_mola_roughness.png'
  ], (textures) => {
    console.log('Mars textures loaded successfully:', textures.length);
  });

  // Auto-rotate the planet
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05; // Slower rotation for better viewing
    }
  });

  console.log('Planet component rendering...');

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[2.2, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={0.7}
        metalness={0.1}
        normalScale={[0.5, 0.5]}
      />
    </mesh>
  );
}

// Loading Component
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

// Error Boundary Component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-center space-y-4 p-8">
        <div className="w-96 h-96 bg-mars-gradient rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h3 className="text-white font-display text-xl">WebGL Error</h3>
            <p className="text-gray-300 max-w-md">
              Your browser doesn't support WebGL or it's disabled. 
              The Mars globe requires WebGL for 3D rendering.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scene Component with lighting and environment
function Scene({ locations, onLocationSelect, onLocationHover }: {
  locations: LocationData[];
  onLocationSelect?: (location: LocationData) => void;
  onLocationHover?: (location: LocationData | null) => void;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />
      
      {/* Mars Planet */}
      <Planet />
      
      {/* Location Markers */}
      <LocationMarkers 
        locations={locations}
        onSelect={onLocationSelect}
        onHover={onLocationHover}
        selectedLocation={null}
      />
      
      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={3.5}
        maxDistance={10}
        autoRotate={false}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
      
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
    </>
  );
}

// Main Mars Globe Component
export default function MarsGlobe({ 
  locations, 
  onLocationSelect, 
  onLocationHover, 
  className = "" 
}: MarsGlobeProps) {
  const [error, setError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check WebGL support
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      setError(new Error('WebGL not supported'));
    }
  }, []);

  // Handle canvas errors
  const handleCreated = ({ gl, scene, camera }: { gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera }) => {
    console.log('WebGL context created successfully');
    console.log('Scene:', scene);
    console.log('Camera:', camera);
    
    gl.setClearColor('#000000');
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Handle context loss
    gl.domElement.addEventListener('webglcontextlost', (event) => {
      console.error('WebGL context lost');
      event.preventDefault();
      setError(new Error('WebGL context lost'));
    });
    
    gl.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      setError(null);
    });
  };

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        ref={canvasRef}
        onCreated={handleCreated}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        className="w-full h-full"
        onPointerMissed={() => {
          // Deselect location when clicking empty space
          onLocationSelect?.(null as any);
          onLocationHover?.(null);
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene
            locations={locations}
            onLocationSelect={onLocationSelect}
            onLocationHover={onLocationHover}
          />
        </Suspense>
      </Canvas>
      
      {/* Attribution */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-2 text-white text-xs">
          Mars imagery: NASA/JPL
        </div>
      </div>
    </div>
  );
}