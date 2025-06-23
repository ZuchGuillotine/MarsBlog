import * as THREE from 'three';
import type { WebGLCapabilities, PerformanceMetrics } from '../types/mars';

/**
 * Performance utilities for Mars Globe optimization
 */

// Detect WebGL capabilities
export const detectWebGLCapabilities = (): WebGLCapabilities => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return {
      supported: false,
      version: 'none',
      renderer: 'none',
      maxTextureSize: 0,
      maxVertexUniforms: 0,
      maxFragmentUniforms: 0,
      extensions: []
    };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const extensions = gl.getSupportedExtensions() || [];

  return {
    supported: true,
    version: gl.getParameter(gl.VERSION),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    extensions
  };
};

// Determine optimal LOD based on device capabilities
export const getOptimalLOD = (capabilities: WebGLCapabilities): {
  sphereSegments: number;
  textureSize: string;
  enableShadows: boolean;
  enablePostProcessing: boolean;
} => {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const isHighEnd = capabilities.maxTextureSize >= 4096 && !isMobile;
  const isMidRange = capabilities.maxTextureSize >= 2048;

  if (isHighEnd) {
    return {
      sphereSegments: 64,
      textureSize: '4k',
      enableShadows: true,
      enablePostProcessing: true
    };
  } else if (isMidRange) {
    return {
      sphereSegments: 32,
      textureSize: '2k',
      enableShadows: true,
      enablePostProcessing: false
    };
  } else {
    return {
      sphereSegments: 16,
      textureSize: '1k',
      enableShadows: false,
      enablePostProcessing: false
    };
  }
};

// Texture optimization
export class TextureOptimizer {
  private static cache = new Map<string, THREE.Texture>();
  
  static async loadOptimizedTexture(url: string, maxSize?: number): Promise<THREE.Texture> {
    const cacheKey = `${url}_${maxSize || 'original'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const loader = new THREE.TextureLoader();
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });

    // Optimize texture settings
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    // Resize if needed
    if (maxSize && texture.image) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const { width, height } = texture.image;
      const scale = Math.min(maxSize / width, maxSize / height, 1);
      
      if (scale < 1) {
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        
        const optimizedTexture = new THREE.CanvasTexture(canvas);
        optimizedTexture.generateMipmaps = true;
        optimizedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        optimizedTexture.magFilter = THREE.LinearFilter;
        optimizedTexture.wrapS = optimizedTexture.wrapT = THREE.RepeatWrapping;
        
        this.cache.set(cacheKey, optimizedTexture);
        return optimizedTexture;
      }
    }

    this.cache.set(cacheKey, texture);
    return texture;
  }

  static clearCache(): void {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
  }
}

// Geometry optimization
export class GeometryOptimizer {
  private static cache = new Map<string, THREE.BufferGeometry>();

  static getSphereGeometry(radius: number, segments: number): THREE.SphereGeometry {
    const cacheKey = `sphere_${radius}_${segments}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as THREE.SphereGeometry;
    }

    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Optimize geometry
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    
    this.cache.set(cacheKey, geometry);
    return geometry;
  }

  static clearCache(): void {
    this.cache.forEach(geometry => geometry.dispose());
    this.cache.clear();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    webglSupported: false,
    devicePixelRatio: 1
  };

  private static startTime: number = 0;
  private static frameCount: number = 0;
  private static lastTime: number = 0;

  static startLoadTimer(): void {
    this.startTime = performance.now();
  }

  static endLoadTimer(): void {
    if (this.startTime > 0) {
      this.metrics.loadTime = performance.now() - this.startTime;
    }
  }

  static updateRenderMetrics(): void {
    const now = performance.now();
    
    if (this.lastTime > 0) {
      this.metrics.renderTime = now - this.lastTime;
    }
    
    this.lastTime = now;
    this.frameCount++;
  }

  static getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      webglSupported: detectWebGLCapabilities().supported,
      devicePixelRatio: window.devicePixelRatio || 1,
      memoryUsage: (performance as any).memory?.usedJSHeapSize
    };
  }

  static logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('Performance Metrics:', {
      'Load Time': `${metrics.loadTime.toFixed(2)}ms`,
      'Render Time': `${metrics.renderTime.toFixed(2)}ms`,
      'WebGL Support': metrics.webglSupported ? 'Yes' : 'No',
      'Device Pixel Ratio': metrics.devicePixelRatio,
      'Memory Usage': metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
    });
  }
}

// Memory management
export class MemoryManager {
  private static disposables: Array<{ dispose(): void }> = [];

  static register(disposable: { dispose(): void }): void {
    this.disposables.push(disposable);
  }

  static cleanup(): void {
    this.disposables.forEach(item => {
      try {
        item.dispose();
      } catch (error) {
        console.warn('Error disposing resource:', error);
      }
    });
    this.disposables = [];
    
    // Clear caches
    TextureOptimizer.clearCache();
    GeometryOptimizer.clearCache();
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }
}

// Adaptive quality settings
export class AdaptiveQuality {
  private static currentQuality: 'low' | 'medium' | 'high' = 'medium';
  private static frameRate: number = 60;
  private static frameCount: number = 0;
  private static lastCheck: number = 0;

  static updateFrameRate(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastCheck > 1000) { // Check every second
      this.frameRate = this.frameCount;
      this.frameCount = 0;
      this.lastCheck = now;
      
      this.adjustQuality();
    }
  }

  private static adjustQuality(): void {
    const previousQuality = this.currentQuality;
    
    if (this.frameRate < 30 && this.currentQuality === 'high') {
      this.currentQuality = 'medium';
    } else if (this.frameRate < 20 && this.currentQuality === 'medium') {
      this.currentQuality = 'low';
    } else if (this.frameRate > 50 && this.currentQuality === 'low') {
      this.currentQuality = 'medium';
    } else if (this.frameRate > 55 && this.currentQuality === 'medium') {
      this.currentQuality = 'high';
    }
    
    if (previousQuality !== this.currentQuality) {
      console.log(`Quality adjusted from ${previousQuality} to ${this.currentQuality} (${this.frameRate}fps)`);
      this.dispatchQualityChange();
    }
  }

  private static dispatchQualityChange(): void {
    window.dispatchEvent(new CustomEvent('qualityChange', {
      detail: { quality: this.currentQuality, frameRate: this.frameRate }
    }));
  }

  static getCurrentQuality(): 'low' | 'medium' | 'high' {
    return this.currentQuality;
  }

  static getQualitySettings() {
    const quality = this.currentQuality;
    
    return {
      low: {
        sphereSegments: 16,
        enableShadows: false,
        enablePostProcessing: false,
        textureSize: 1024,
        maxMarkers: 5
      },
      medium: {
        sphereSegments: 32,
        enableShadows: true,
        enablePostProcessing: false,
        textureSize: 2048,
        maxMarkers: 10
      },
      high: {
        sphereSegments: 64,
        enableShadows: true,
        enablePostProcessing: true,
        textureSize: 4096,
        maxMarkers: 20
      }
    }[quality];
  }
}

// Preloader for critical resources
export class ResourcePreloader {
  private static loadedResources = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  static async preloadTextures(urls: string[]): Promise<void> {
    const loadPromises = urls.map(url => this.preloadTexture(url));
    await Promise.all(loadPromises);
  }

  private static async preloadTexture(url: string): Promise<THREE.Texture> {
    if (this.loadedResources.has(url)) {
      return TextureOptimizer.loadOptimizedTexture(url);
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = TextureOptimizer.loadOptimizedTexture(url);
    this.loadingPromises.set(url, promise);

    try {
      const texture = await promise;
      this.loadedResources.add(url);
      return texture;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  static getLoadedCount(): number {
    return this.loadedResources.size;
  }

  static isLoaded(url: string): boolean {
    return this.loadedResources.has(url);
  }
}

export default {
  detectWebGLCapabilities,
  getOptimalLOD,
  TextureOptimizer,
  GeometryOptimizer,
  PerformanceMonitor,
  MemoryManager,
  AdaptiveQuality,
  ResourcePreloader
};