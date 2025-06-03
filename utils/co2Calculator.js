/**
 * Utility functions for calculating CO2 savings from carpooling
 */

// Average CO2 emissions per mile for a gasoline-powered car (in kg/mile)
const AVERAGE_CO2_PER_MILE = 0.404; // kg CO2 per mile (source: EPA)

/**
 * Calculate CO2 savings from carpooling
 * @param {number} distanceMiles - Distance traveled in miles
 * @param {number} numPassengers - Number of passengers (including driver)
 * @param {number} [maxCapacity=4] - Maximum capacity of the car (including driver)
 * @returns {Object} Object containing CO2 savings information
 */
function calculateCO2Savings(distanceMiles, numPassengers, maxCapacity = 4) {
  console.log('[CO2 Calculator] Input - distanceMiles:', distanceMiles, 'numPassengers:', numPassengers, 'maxCapacity:', maxCapacity);
  
  // Calculate emissions for single occupancy
  const singleOccupancyEmissions = distanceMiles * AVERAGE_CO2_PER_MILE;
  
  // Calculate actual savings from current passengers
  const actualCarsEliminated = Math.max(0, numPassengers - 1);
  const actualSavings = singleOccupancyEmissions * actualCarsEliminated;
  
  // Calculate potential savings if car was at full capacity
  const potentialCarsEliminated = Math.max(0, maxCapacity - 1);
  const potentialSavings = singleOccupancyEmissions * potentialCarsEliminated;
  
  // Calculate per-passenger savings
  const savingsPerPassenger = actualSavings / Math.max(1, numPassengers);
  const potentialPerPassenger = potentialSavings / maxCapacity;
  
  const result = {
    // Total savings for the carpool
    actual: Math.round(actualSavings * 100) / 100,
    potential: Math.round(potentialSavings * 100) / 100,
    
    // Per-passenger savings
    perPassenger: Math.round(savingsPerPassenger * 100) / 100,
    potentialPerPassenger: Math.round(potentialPerPassenger * 100) / 100,
    
    // Car information
    isAtCapacity: numPassengers >= maxCapacity,
    seatsFilled: numPassengers,
    seatsAvailable: maxCapacity - numPassengers,
    
    // Debug information
    _debug: {
      singleOccupancyEmissions: Math.round(singleOccupancyEmissions * 100) / 100,
      actualCarsEliminated,
      potentialCarsEliminated,
      savingsPerPassenger: Math.round(savingsPerPassenger * 100) / 100
    }
  };
  
  console.log('[CO2 Calculator] Output:', JSON.stringify(result, null, 2));
  return result;
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
