const NodeGeocoder = require('node-geocoder');

// Configure the geocoder
const options = {
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null
};

const geocoder = NodeGeocoder(options);

/**
 * Geocode an address to get latitude and longitude
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number}>} - Object containing lat and lng
 */
async function geocodeAddress(address) {
  try {
    const res = await geocoder.geocode(address);
    if (res && res[0]) {
      return {
        lat: res[0].latitude,
        lng: res[0].longitude
      };
    }
    throw new Error('No results found');
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

module.exports = { geocodeAddress };
