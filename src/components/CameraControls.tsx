import React, { useRef, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

// Extend Three.js with OrbitControls
extend({ OrbitControls });

interface CameraControlsProps {
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  target?: [number, number, number];
  onStart?: () => void;
  onEnd?: () => void;
  onDrag?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: any;
    }
  }
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  enablePan = false,
  enableZoom = true,
  enableRotate = true,
  minDistance = 3,
  maxDistance = 10,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  enableDamping = true,
  dampingFactor = 0.05,
  minPolarAngle = Math.PI * 0.1, // 18 degrees from top
  maxPolarAngle = Math.PI * 0.9, // 18 degrees from bottom
  target = [0, 0, 0],
  onStart,
  onEnd,
  onDrag
}) => {
  const controlsRef = useRef<OrbitControls>(null);
  const { camera, gl } = useThree();
  
  const isUserInteracting = useRef(false);
  const userInteractionTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      // Event handlers
      const handleStart = () => {
        isUserInteracting.current = true;
        onStart?.();
      };

      const handleEnd = () => {
        isUserInteracting.current = false;
        // Reset auto-rotation after a delay
        if (userInteractionTimeout.current) {
          clearTimeout(userInteractionTimeout.current);
        }
        userInteractionTimeout.current = setTimeout(() => {
          if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotate;
          }
        }, 2000); // Resume auto-rotation after 2 seconds of inactivity
        onEnd?.();
      };

      const handleChange = () => {
        // Disable auto-rotation when user is interacting
        if (controlsRef.current && isUserInteracting.current) {
          controlsRef.current.autoRotate = false;
        }
        onDrag?.();
      };

      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);
      controls.addEventListener('change', handleChange);

      return () => {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
        controls.removeEventListener('change', handleChange);
        if (userInteractionTimeout.current) {
          clearTimeout(userInteractionTimeout.current);
        }
      };
    }
  }, [autoRotate, onStart, onEnd, onDrag]);

  useFrame((state, delta) => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  // Enhanced keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controlsRef.current) return;

      const controls = controlsRef.current;
      const rotationSpeed = 0.1;
      const zoomSpeed = 0.5;

      switch (event.code) {
        case 'ArrowLeft':
          event.preventDefault();
          controls.object.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed);
          controls.update();
          break;
        case 'ArrowRight':
          event.preventDefault();
          controls.object.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationSpeed);
          controls.update();
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (controls.object.position.length() > minDistance) {
            controls.object.position.multiplyScalar(0.9);
            controls.update();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (controls.object.position.length() < maxDistance) {
            controls.object.position.multiplyScalar(1.1);
            controls.update();
          }
          break;
        case 'Space':
          event.preventDefault();
          // Reset to default position
          controls.reset();
          break;
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [minDistance, maxDistance]);

  // Touch gesture handling for mobile
  useEffect(() => {
    let touchStart: { x: number; y: number } | null = null;
    let lastTouchDistance = 0;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchStart = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      } else if (event.touches.length === 2) {
        // Pinch gesture start
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!controlsRef.current) return;

      if (event.touches.length === 2) {
        // Pinch to zoom
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastTouchDistance > 0) {
          const delta = currentDistance - lastTouchDistance;
          const zoomDelta = delta * 0.01;
          
          const newDistance = Math.max(
            minDistance,
            Math.min(maxDistance, controlsRef.current.object.position.length() - zoomDelta)
          );
          
          controlsRef.current.object.position.normalize().multiplyScalar(newDistance);
          controlsRef.current.update();
        }
        
        lastTouchDistance = currentDistance;
      }
    };

    const handleTouchEnd = () => {
      touchStart = null;
      lastTouchDistance = 0;
    };

    // Add touch event listeners
    gl.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gl.domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl.domElement, minDistance, maxDistance]);

  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableRotate={enableRotate}
      minDistance={minDistance}
      maxDistance={maxDistance}
      autoRotate={autoRotate && !isUserInteracting.current}
      autoRotateSpeed={autoRotateSpeed}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      target={target}
      screenSpacePanning={false}
      // Zoom settings
      zoomSpeed={1.2}
      panSpeed={0.8}
      rotateSpeed={0.5}
      // Smooth easing
      enableKeys={false} // We handle keyboard controls manually
    />
  );
};

export default CameraControls;