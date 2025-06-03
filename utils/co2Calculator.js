/**
 * Utility functions for calculating CO2 savings from carpooling
 */

// Average CO2 emissions per mile for a gasoline-powered car (in kg/mile)
const AVERAGE_CO2_PER_MILE = 0.404; // kg CO2 per mile (source: EPA)

/**
 * Calculate CO2 savings from carpooling
 * @param {number} distanceMiles - Distance traveled in miles
 * @param {number} numPassengers - Number of passengers (including driver)
 * @returns {number} CO2 savings in kg
 */
function calculateCO2Savings(distanceMiles, numPassengers) {
  if (numPassengers < 1) return 0;
  
  // Calculate the CO2 that would have been emitted if everyone drove separately
  const totalCO2IfSeparate = distanceMiles * AVERAGE_CO2_PER_MILE * numPassengers;
  
  // Calculate the CO2 emitted by carpooling (one car instead of multiple)
  const co2FromCarpool = distanceMiles * AVERAGE_CO2_PER_MILE;
  
  // Calculate savings (total that would have been emitted - actual emissions)
  const savings = totalCO2IfSeparate - co2FromCarpool;
  
  // Return savings rounded to 2 decimal places
  return Math.round(savings * 100) / 100;
}

/**
 * Calculate CO2 savings per passenger
 * @param {number} distanceMiles - Distance traveled in miles
 * @param {number} totalPassengers - Total number of passengers (including driver)
 * @returns {number} CO2 savings per passenger in kg
 */
function calculateCO2SavingsPerPassenger(distanceMiles, totalPassengers) {
  if (totalPassengers <= 1) return 0;
  
  const totalSavings = calculateCO2Savings(distanceMiles, totalPassengers);
  return totalSavings / totalPassengers;
}

module.exports = {
  calculateCO2Savings,
  calculateCO2SavingsPerPassenger,
  AVERAGE_CO2_PER_MILE
};
