/**
 * Utility functions for handling CO2 savings related to carpools
 */

/**
 * Calculate and update CO2 savings when a carpool is created or joined
 * @param {number} distanceMiles - Distance of the carpool trip in miles
 * @param {number} numPassengers - Number of people in the carpool (including driver)
 * @returns {Promise<{success: boolean, co2Savings?: number, error?: string}>}
 */
async function updateCO2SavingsForCarpool(distanceMiles, numPassengers) {
  try {
    const response = await fetch('/api/update-co2-savings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        distanceMiles: parseFloat(distanceMiles),
        numPassengers: parseInt(numPassengers, 10)
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      // Dispatch an event to notify that CO2 savings were updated
      document.dispatchEvent(new CustomEvent('co2-savings-updated', {
        detail: {
          co2Savings: data.co2Savings,
          totalCo2Saved: data.totalCo2Saved
        }
      }));
      
      return { success: true, co2Savings: data.co2Savings };
    } else {
      console.error('Failed to update CO2 savings:', data.error);
      return { success: false, error: data.error || 'Failed to update CO2 savings' };
    }
  } catch (error) {
    console.error('Error updating CO2 savings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format a distance in miles to a human-readable string
 * @param {number} miles - Distance in miles
 * @returns {string} Formatted distance string
 */
function formatDistance(miles) {
  if (miles < 1) {
    return `${Math.round(miles * 5280)} feet`;
  }
  return `${miles.toFixed(1)} miles`;
}

/**
 * Format CO2 savings in kg to a human-readable string
 * @param {number} kg - CO2 savings in kilograms
 * @returns {string} Formatted CO2 savings string
 */
function formatCO2Savings(kg) {
  if (kg < 1) {
    return `${Math.round(kg * 1000)} grams CO₂`;
  }
  return `${kg.toFixed(1)} kg CO₂`;
}

// Export for browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateCO2SavingsForCarpool,
    formatDistance,
    formatCO2Savings
  };
}
