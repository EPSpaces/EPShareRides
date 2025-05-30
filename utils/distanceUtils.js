// Function to calculate distance between two points in miles using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert degrees to radians
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in miles
  return distance;
}

// Function to calculate CO2 savings in kg
// distance: distance in miles
// numPassengers: number of people in the carpool (including driver)
function calculateCO2Savings(distance, numPassengers) {
  if (numPassengers < 1) return 0;
  
  // Average car emits 411g of CO2 per mile
  const co2PerMileGrams = 411;
  
  // Calculate total CO2 that would be emitted if everyone drove separately
  const totalCO2IfSeparate = distance * co2PerMileGrams * numPassengers;
  
  // Calculate CO2 emitted by the carpool
  const co2ForCarpool = distance * co2PerMileGrams;
  
  // Calculate savings per person (in grams)
  const savingsPerPerson = (totalCO2IfSeparate / numPassengers) - co2ForCarpool / numPassengers;
  
  // Convert to kg and return
  return Math.round((savingsPerPerson / 1000) * 100) / 100; // Round to 2 decimal places
}

module.exports = {
  calculateDistance,
  calculateCO2Savings
};
