// Test script for CO2 savings functionality
const axios = require('axios');
const { calculateCO2Savings } = require('./utils/distanceUtils');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword';

// Helper function to get auth token
async function getAuthToken() {
  try {
    // In a real test, you would use your actual authentication endpoint
    // This is just a placeholder - replace with your actual auth logic
    const response = await axios.post(`${BASE_URL}/api/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD
    });
    return response.data.token;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    process.exit(1);
  }
}

// Test CO2 savings calculation
function testCO2Calculation() {
  console.log('\n--- Testing CO2 Savings Calculation ---');
  
  const testCases = [
    { distance: 10, passengers: 2, expected: 2.06 },
    { distance: 5, passengers: 3, expected: 1.37 },
    { distance: 20, passengers: 4, expected: 6.17 }
  ];

  testCases.forEach((test, index) => {
    const result = calculateCO2Savings(test.distance, test.passengers);
    const passed = Math.abs(result - test.expected) < 0.001;
    console.log(`Test ${index + 1}:`);
    console.log(`  Distance: ${test.distance} miles, Passengers: ${test.passengers}`);
    console.log(`  Expected: ${test.expected} kg CO2, Got: ${result.toFixed(3)} kg CO2`);
    console.log(`  Result: ${passed ? 'PASSED' : 'FAILED'}\n`);
  });
}

// Test API endpoints
async function testEndpoints() {
  console.log('\n--- Testing API Endpoints ---');
  
  try {
    // For testing without authentication
    const headers = {};
    // In a real test, you would get the token like this:
    // const token = await getAuthToken();
    // const headers = { Authorization: `Bearer ${token}` };
    
    // Test getting CO2 savings
    console.log('\n1. Testing GET /api/user/co2-savings');
    try {
      const getResponse = await axios.get(`${BASE_URL}/api/user/co2-savings`, { headers });
      const currentSavings = getResponse.data.co2Saved || 0;
      console.log('   Current CO2 Savings:', currentSavings, 'kg');
    } catch (error) {
      console.log('   Note: GET /api/user/co2-savings endpoint not available');
    }
    
    // Test updating CO2 savings
    console.log('\n2. Testing POST /api/update-co2-savings');
    const distance = 15;
    const passengers = 3;
    const expectedSavings = calculateCO2Savings(distance, passengers);
    
    try {
      const postResponse = await axios.post(
        `${BASE_URL}/api/update-co2-savings`,
        { distanceMiles: distance, numPassengers: passengers },
        { headers }
      );
      
      const savings = postResponse.data.co2Savings || 0;
      console.log('   Added CO2 Savings:', savings.toFixed(3), 'kg');
      console.log('   Success:', postResponse.data.success || 'N/A');
      
      // Verify the update
      try {
        const updatedResponse = await axios.get(`${BASE_URL}/api/user/co2-savings`, { headers });
        console.log('   Updated Total CO2 Savings:', updatedResponse.data.co2Saved || 0, 'kg');
      } catch (error) {
        console.log('   Could not verify updated CO2 savings');
      }
    } catch (error) {
      console.log('   Note: POST /api/update-co2-savings endpoint not available');
      console.log('   Error:', error.response?.data?.message || error.message);
    }
  } catch (error) {
    console.error('API Test Failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting CO2 Savings Tests...');
  
  // Test calculation logic
  testCO2Calculation();
  
  // Test API endpoints (requires server to be running)
  await testEndpoints();
  
  console.log('\nTest completed!');
}

// Start the tests
runTests().catch(console.error);
