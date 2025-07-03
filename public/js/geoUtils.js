/**
 * Client-side utility functions for geolocation calculations
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
 * Get the user's current location using the browser's geolocation API
 * @returns {Promise<{lat: number, lng: number}>} Resolves with user's coordinates or defaults to Seattle
 */
async function getUserLocation() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Seattle coordinates if location access is denied or fails
          resolve({ lat: 47.6062, lng: -122.3321 });
        }
      );
    } else {
      // Default to Seattle if geolocation is not supported
      resolve({ lat: 47.6062, lng: -122.3321 });
    }
  });
}

// Make functions available globally
window.geoUtils = {
  calculateDistance,
  getUserLocation
};
