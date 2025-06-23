import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, Vector3, MathUtils } from 'three';
import * as THREE from 'three';

interface PlanetProps {
  radius?: number;
  segments?: number;
  textureUrl: string;
  elevationUrl?: string;
  roughnessUrl?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  onLoad?: () => void;
  mousePosition?: { x: number; y: number };
}

export const Planet: React.FC<PlanetProps> = ({
  radius = 2,
  segments = 64,
  textureUrl,
  elevationUrl,
  roughnessUrl,
  autoRotate = true,
  rotationSpeed = 0.005,
  onLoad,
  mousePosition
}) => {
  const meshRef = useRef<Mesh>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mouseInfluence = useRef(new Vector3(0, 0, 0));

  // Load textures
  const [colorTexture, elevationTexture, roughnessTexture] = useLoader(TextureLoader, [
    textureUrl,
    elevationUrl || textureUrl, // Fallback to color texture if no elevation
    roughnessUrl || elevationUrl || textureUrl // Use elevation as roughness if no specific roughness map
  ]);

  // Configure textures
  useEffect(() => {
    // Color texture (Mars surface)
    colorTexture.wrapS = colorTexture.wrapT = THREE.RepeatWrapping;
    colorTexture.generateMipmaps = true;
    colorTexture.minFilter = THREE.LinearMipmapLinearFilter;
    colorTexture.magFilter = THREE.LinearFilter;

    // Elevation/displacement texture
    if (elevationTexture && elevationTexture !== colorTexture) {
      elevationTexture.wrapS = elevationTexture.wrapT = THREE.RepeatWrapping;
      elevationTexture.generateMipmaps = true;
      elevationTexture.minFilter = THREE.LinearMipmapLinearFilter;
      elevationTexture.magFilter = THREE.LinearFilter;
    }

    // Roughness texture
    if (roughnessTexture && roughnessTexture !== colorTexture) {
      roughnessTexture.wrapS = roughnessTexture.wrapT = THREE.RepeatWrapping;
      roughnessTexture.generateMipmaps = true;
      roughnessTexture.minFilter = THREE.LinearMipmapLinearFilter;
      roughnessTexture.magFilter = THREE.LinearFilter;
    }

    setIsLoaded(true);
    onLoad?.();
  }, [colorTexture, elevationTexture, roughnessTexture, onLoad]);

  // Create advanced material with multiple texture maps
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: colorTexture,
      roughnessMap: roughnessTexture !== colorTexture ? roughnessTexture : null,
      roughness: 0.8,
      metalness: 0.1,
      bumpMap: elevationTexture !== colorTexture ? elevationTexture : null,
      bumpScale: 0.02,
      normalScale: new THREE.Vector2(0.5, 0.5),
    });

    // Add subtle emission for Mars glow effect
    mat.emissive = new THREE.Color(0x331100);
    mat.emissiveIntensity = 0.05;

    return mat;
  }, [colorTexture, elevationTexture, roughnessTexture]);

  // Enhanced geometry with more detail for better terrain representation
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(radius, segments, segments);
  }, [radius, segments]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Auto rotation
    if (autoRotate) {
      meshRef.current.rotation.y += rotationSpeed * delta * 60; // 60fps normalized
    }

    // Mouse influence for subtle tilt effect
    if (mousePosition) {
      const targetInfluence = new Vector3(
        (mousePosition.y - 0.5) * 0.1, // Vertical mouse movement affects X rotation
        (mousePosition.x - 0.5) * 0.1, // Horizontal mouse movement affects Y rotation
        0
      );
      
      mouseInfluence.current.lerp(targetInfluence, 0.02);
      
      // Apply subtle tilt based on mouse position
      meshRef.current.rotation.x = mouseInfluence.current.x;
      meshRef.current.rotation.z = mouseInfluence.current.z;
    }

    // Subtle pulsing effect for the emissive glow
    if (material) {
      const time = state.clock.elapsedTime;
      material.emissiveIntensity = 0.05 + Math.sin(time * 0.5) * 0.01;
    }
  });

  // Atmospheric glow effect
  const AtmosphereGlow = () => {
    const atmosphereRef = useRef<Mesh>(null);
    
    const atmosphereMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          time: { value: 0 },
          color: { value: new THREE.Color(0xff6b35) }
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            float pulse = 0.8 + 0.2 * sin(time * 2.0);
            gl_FragColor = vec4(color, 1.0) * intensity * pulse * 0.3;
          }
        `
      });
    }, []);

    useFrame((state) => {
      if (atmosphereRef.current && atmosphereMaterial) {
        atmosphereMaterial.uniforms.time.value = state.clock.elapsedTime;
      }
    });

    return (
      <mesh ref={atmosphereRef} scale={1.02}>
        <sphereGeometry args={[radius, 32, 32]} />
        <primitive object={atmosphereMaterial} />
      </mesh>
    );
  };

  return (
    <group>
      {/* Main Mars planet */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        position={[0, 0, 0]}
      />
      
      {/* Atmospheric glow */}
      <AtmosphereGlow />
      
      {/* Subtle ring system (Mars has very faint dust rings) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[radius * 2.1, radius * 2.3, 64]} />
        <meshBasicMaterial
          color={0x8b4513}
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default Planet;