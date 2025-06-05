/**
 * Server-side utility functions for geolocation calculations
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param {Object} point1 - First point with lat and lng properties
 * @param {Object} point2 - Second point with lat and lng properties
 * @returns {number} Distance in miles
 */
function calculateDistance(point1, point2) {
  // Earth's radius in miles
  const R = 3958.8;
  
  // Convert latitude and longitude from degrees to radians
  const lat1 = toRadians(point1.lat);
  const lng1 = toRadians(point1.lng);
  const lat2 = toRadians(point2.lat);
  const lng2 = toRadians(point2.lng);

  // Differences in coordinates
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Add a multiplier to account for roads (not straight-line distance)
  // Typically, road distance is 1.2-1.4x the straight-line distance in urban areas
  const roadDistanceMultiplier = 1.3;
  
  // Round to 2 decimal places
  return Math.round((distance * roadDistanceMultiplier) * 100) / 100;
}

/**
 * Geocode an address to get its latitude and longitude
 * This is a simple implementation that would use a geocoding service in production
 * For now, it returns a fixed location for testing
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}>} Latitude and longitude
 */
async function geocodeAddress(address) {
  // In a real app, you would use a geocoding service here
  // For now, return a fixed location for testing
  console.log(`Geocoding address: ${address}`);
  
  // Return a default location (e.g., your school's coordinates)
  // Replace these with actual coordinates if known
  return {
    lat: 47.6062, // Example: Seattle coordinates
    lng: -122.3321
  };
}

/**
 * Get the midpoint between two coordinates
 * @param {Object} coord1 - First coordinate with lat and lng properties
 * @param {Object} coord2 - Second coordinate with lat and lng properties
 * @returns {{lat: number, lng: number}} Midpoint coordinate
 */
function getMidpoint(coord1, coord2) {
  return {
    lat: (coord1.lat + coord2.lat) / 2,
    lng: (coord1.lng + coord2.lng) / 2
  };
}

module.exports = {
  calculateDistance,
  geocodeAddress,
  getMidpoint,
  toRadians
};
