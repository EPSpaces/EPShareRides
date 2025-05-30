// Function to update the CO2 savings display in the UI
function updateCO2SavingsDisplay(savingsKg) {
  const co2Element = document.getElementById('co2-savings');
  if (co2Element) {
    co2Element.textContent = `${savingsKg} kg CO₂`;
  }
}

// Function to fetch and update CO2 savings from the server
async function fetchAndUpdateCO2Savings() {
  try {
    const response = await fetch('/api/user/co2-savings');
    if (response.ok) {
      const data = await response.json();
      updateCO2SavingsDisplay(data.co2Saved || 0);
    }
  } catch (error) {
    console.error('Error fetching CO2 savings:', error);
  }
}

// Update CO2 savings when the page loads
document.addEventListener('DOMContentLoaded', fetchAndUpdateCO2Savings);

// Export functions for testing or other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateCO2SavingsDisplay,
    fetchAndUpdateCO2Savings
  };
}
