import type { Coordinates, Position3D } from '../types/location';

/**
 * Convert latitude/longitude coordinates to 3D position on a sphere
 * @param lat Latitude in degrees (-90 to 90)
 * @param lng Longitude in degrees (-180 to 180)
 * @param radius Sphere radius (default: 1)
 * @returns 3D position vector
 */
export function coordinatesToPosition3D(
  lat: number, 
  lng: number, 
  radius: number = 1
): Position3D {
  // Convert degrees to radians
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  // Calculate 3D position on sphere surface
  const x = radius * Math.cos(latRad) * Math.cos(lngRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lngRad);

  return { x, y, z };
}

/**
 * Convert 3D position back to latitude/longitude
 * @param position 3D position vector
 * @param radius Sphere radius (default: 1)
 * @returns Latitude/longitude coordinates
 */
export function position3DToCoordinates(
  position: Position3D, 
  radius: number = 1
): Coordinates {
  const { x, y, z } = position;
  
  // Calculate latitude
  const lat = Math.asin(y / radius) * (180 / Math.PI);
  
  // Calculate longitude
  const lng = Math.atan2(z, x) * (180 / Math.PI);
  
  return { lat, lng };
}

/**
 * Calculate distance between two coordinates on Mars surface
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @param marsRadius Mars radius in km (default: 3389.5)
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates, 
  coord2: Coordinates, 
  marsRadius: number = 3389.5
): number {
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLatRad = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLngRad = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return marsRadius * c;
}

/**
 * Generate hotspot positions around a main location
 * @param center Center coordinates
 * @param count Number of hotspots to generate
 * @param radius Radius in degrees
 * @returns Array of hotspot coordinates
 */
export function generateHotspots(
  center: Coordinates, 
  count: number, 
  radius: number = 5
): Coordinates[] {
  const hotspots: Coordinates[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count;
    const lat = center.lat + radius * Math.cos(angle);
    const lng = center.lng + radius * Math.sin(angle);
    
    // Clamp to valid ranges
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLng = ((lng + 180) % 360) - 180;
    
    hotspots.push({ lat: clampedLat, lng: clampedLng });
  }
  
  return hotspots;
}

/**
 * Check if coordinates are within Mars bounds
 * @param coordinates Coordinates to validate
 * @returns True if valid
 */
export function isValidMarsCoordinate(coordinates: Coordinates): boolean {
  return (
    coordinates.lat >= -90 && coordinates.lat <= 90 &&
    coordinates.lng >= -180 && coordinates.lng <= 180
  );
}

/**
 * Format coordinates for display
 * @param coordinates Coordinates to format
 * @returns Formatted string
 */
export function formatCoordinates(coordinates: Coordinates): string {
  const latDirection = coordinates.lat >= 0 ? 'N' : 'S';
  const lngDirection = coordinates.lng >= 0 ? 'E' : 'W';
  
  const lat = Math.abs(coordinates.lat).toFixed(2);
  const lng = Math.abs(coordinates.lng).toFixed(2);
  
  return `${lat}°${latDirection}, ${lng}°${lngDirection}`;
}