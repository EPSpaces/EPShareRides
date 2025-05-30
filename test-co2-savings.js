// Test script for CO2 savings functionality
const axios = require('axios');
const { calculateCO2Savings } = require('./utils/distanceUtils');
const admin = require('firebase-admin');
const fs = require('fs');

// Try to load Firebase service account
let serviceAccount;
try {
  serviceAccount = require('./service_account.json');
  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.warn('Warning: Could not initialize Firebase Admin SDK. Some tests may fail.');
  console.warn('Make sure service_account.json exists in the project root.');
}

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com'; // Replace with a test user email

// Helper function to get Firebase ID token
async function getIdToken(email) {
  // If Firebase Admin SDK is not initialized, return a mock token for testing
  if (!serviceAccount) {
    console.warn('Using mock token - Firebase Admin SDK not initialized');
    return 'mock-auth-token-for-testing';
  }

  try {
    // Get the user's Firebase UID
    const user = await admin.auth().getUserByEmail(email);
    
    // In a real test, you would sign in the user to get a fresh ID token
    // For testing, we'll generate a custom token and exchange it for an ID token
    const customToken = await admin.auth().createCustomToken(user.uid);
    
    // Exchange custom token for ID token (this would normally happen on the client)
    // Note: This requires the Firebase Auth REST API
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${serviceAccount.apiKey}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    return response.data.idToken;
  } catch (error) {
    console.error('Error getting ID token:', error.message);
    console.error('Make sure the test user exists in Firebase Authentication');
    
    // For testing purposes, return a mock token if we can't get a real one
    if (process.env.NODE_ENV === 'test') {
      console.warn('Using mock token due to error');
      return 'mock-auth-token-for-testing';
    }
    
    process.exit(1);
  }
}

// Test CO2 savings calculation
function testCO2Calculation() {
  console.log('\n--- Testing CO2 Savings Calculation ---');
  
  const testCases = [
    { distance: 10, passengers: 2, expected: 2.06 },
    { distance: 5, passengers: 3, expected: 1.37 },
    { distance: 20, passengers: 4, expected: 6.17 },
    { distance: 0, passengers: 2, expected: 0 }, // Edge case: zero distance
    { distance: 10, passengers: 1, expected: 0 }  // Edge case: no carpooling
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
    // Get ID token for authentication
    const idToken = await getIdToken(TEST_USER_EMAIL);
    const headers = { 
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Get current CO2 savings
    console.log('\n1. Testing GET /api/user/co2-savings');
    try {
      const getResponse = await axios.get(`${BASE_URL}/api/user/co2-savings`, { headers });
      
      if (getResponse.data.success) {
        console.log('   Current CO2 Savings:', getResponse.data.co2Saved, 'kg');
      } else {
        console.log('   API returned error:', getResponse.data.error);
      }
    } catch (error) {
      console.error('   Error:', error.response?.data?.error || error.message);
    }
    
    // Test 2: Update CO2 savings with valid data
    console.log('\n2. Testing POST /api/update-co2-savings (valid data)');
    const distance = 15;
    const passengers = 3;
    const expectedSavings = calculateCO2Savings(distance, passengers);
    
    try {
      const postResponse = await axios.post(
        `${BASE_URL}/api/update-co2-savings`,
        { distanceMiles: distance, numPassengers: passengers },
        { headers }
      );
      
      if (postResponse.data.success) {
        console.log('   Added CO2 Savings:', postResponse.data.co2Savings.toFixed(2), 'kg');
        console.log('   New Total CO2 Saved:', postResponse.data.totalCo2Saved.toFixed(2), 'kg');
        
        // Verify the update
        const verifyResponse = await axios.get(`${BASE_URL}/api/user/co2-savings`, { headers });
        if (Math.abs(verifyResponse.data.co2Saved - postResponse.data.totalCo2Saved) < 0.01) {
          console.log('   Verification passed: CO2 savings updated correctly');
        } else {
          console.log('   Verification failed: CO2 savings do not match');
        }
      } else {
        console.log('   API returned error:', postResponse.data.error);
      }
    } catch (error) {
      console.error('   Error:', error.response?.data?.error || error.message);
    }
    
    // Test 3: Test with invalid data
    console.log('\n3. Testing POST /api/update-co2-savings (invalid data)');
    try {
      const invalidResponse = await axios.post(
        `${BASE_URL}/api/update-co2-savings`,
        { distanceMiles: 'invalid', numPassengers: 0 },
        { headers }
      );
      console.log('   Unexpected success with invalid data:', invalidResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   Correctly rejected invalid data with status 400');
        console.log('   Error message:', error.response.data.error);
      } else {
        console.error('   Unexpected error:', error.response?.data || error.message);
      }
    }
  } catch (error) {
    console.error('API Test Failed:', error.response?.data || error.message);
  }
}

// Test frontend integration
async function testFrontendIntegration() {
  console.log('\n--- Testing Frontend Integration ---');
  
  try {
    // Test 1: Check if the CO2 savings display exists on the homepage
    console.log('\n1. Testing CO2 savings display on homepage');
    try {
      const response = await axios.get(BASE_URL);
      const hasCo2Display = response.data.includes('co2-savings-display');
      console.log(`   CO2 savings display ${hasCo2Display ? 'found' : 'not found'} on homepage`);
      
      if (!hasCo2Display) {
        console.log('   Make sure you have an element with id="co2-savings-display" in your HTML');
      }
    } catch (error) {
      console.error('   Error checking homepage:', error.message);
    }
    
    // Test 2: Check if the CO2 API endpoint is accessible from the frontend
    console.log('\n2. Testing CO2 API endpoint accessibility');
    try {
      const response = await axios.get(`${BASE_URL}/api/user/co2-savings`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.status === 200) {
        console.log('   CO2 API endpoint is accessible');
        console.log('   Current CO2 savings:', response.data.co2Saved, 'kg');
      } else {
        console.log(`   Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error('   Error accessing CO2 API endpoint:', error.response?.status || error.message);
      if (error.response?.status === 401) {
        console.log('   Make sure the endpoint is properly authenticated');
      }
    }
  } catch (error) {
    console.error('Frontend Integration Test Failed:', error.message);
  }
}

// Main function to run all tests
async function runTests() {
  console.log('\n=== Starting CO2 Savings Tests ===');
  
  // Run calculation tests
  testCO2Calculation();
  
  // Run API endpoint tests
  await testEndpoints();
  
  // Run frontend integration tests
  await testFrontendIntegration();
  
  console.log('\n=== All Tests Completed ===');
  console.log('\nNext Steps:');
  console.log('1. Check the test results above for any failures or warnings');
  console.log('2. If you see any Firebase Admin SDK warnings, make sure service_account.json exists');
  console.log('3. For frontend testing, ensure the server is running and accessible');
  console.log('4. Check the browser console for any JavaScript errors when using the application');
}

// Run the tests
runTests().catch(error => {
  console.error('Test Runner Error:', error);
  process.exit(1);
});
