import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Simple rotating sphere to test if Three.js is working
function TestSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  console.log('TestSphere component rendering...');

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#cd5c5c" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

export default function SimpleTestGlobe() {
  console.log('SimpleTestGlobe component mounting...');

  const handleCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    console.log('WebGL context created in test globe');
    gl.setClearColor('#000011');
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  return (
    <div className="w-full h-full">
      <Canvas
        onCreated={handleCreated}
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Test Sphere */}
        <TestSphere />
        
        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={8}
        />
      </Canvas>
      
      {/* Debug info */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
        Test Globe - If you see this, React is working
      </div>
    </div>
  );
}