const XLSX = require('xlsx');
const NodeGeocoder = require('node-geocoder');
const { getDistance, getPreciseDistance } = require('geolib');
const path = require('path');

// Initialize geocoder with OpenStreetMap provider
const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

// Cache for student data and geocoded addresses
let studentData = [];
const addressCache = new Map();

// Load and process student data from Excel file
async function loadStudentData() {
  try {
    // Use __dirname to get the current directory and navigate to the project root
    const filePath = path.join(__dirname, '../carpool_cleaned_with_full_names.xlsx');
    console.log('Loading student data from:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Get the header row (first row)
    const headers = jsonData[0].map(h => h ? h.trim() : '');
    console.log('Excel headers:', headers);
    
    // Process the data (skip the header row)
    studentData = jsonData.slice(1).map((row, index) => {
      // Skip rows that don't have enough data
      if (!row || row.length < 4) return null;
      
      // Create an object with the correct property names
      const student = {
        Student: '',
        Parent: '',
        Grade: '',
        Address: '',
        Coordinates: null,
        'Parent Contact': ''
      };
      
      // Map each column to the correct property based on the header
      row.forEach((value, colIndex) => {
        const header = headers[colIndex] || '';
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('student')) {
          student.Student = value || '';
        } else if (lowerHeader.includes('parent') && !lowerHeader.includes('contact')) {
          student.Parent = value || '';
        } else if (lowerHeader.includes('grade')) {
          student.Grade = value || '';
        } else if (lowerHeader.includes('address')) {
          student.Address = value || '';
        } else if (lowerHeader.includes('contact')) {
          student['Parent Contact'] = value || '';
        } else if (lowerHeader.includes('longitude') || lowerHeader.includes('latitude')) {
          // Handle coordinates if they exist
          if (!student.Coordinates) student.Coordinates = {};
          if (lowerHeader.includes('longitude')) {
            student.Coordinates.longitude = parseFloat(value) || 0;
          } else {
            student.Coordinates.latitude = parseFloat(value) || 0;
          }
        }
      });
      
      // Only include students with a name and address
      if (!student.Student || !student.Address) {
        console.warn(`Skipping row ${index + 2} - missing required data:`, student);
        return null;
      }
      
      return student;
    }).filter(Boolean); // Remove any null entries
    
    console.log(`Loaded ${studentData.length} student records`);
    return studentData;
  } catch (error) {
    console.error('Error loading student data:', error);
    throw error;
  }
}

// Geocode an address and cache the result
async function geocodeAddress(address) {
  if (!address) return null;
  
  // Check cache first
  if (addressCache.has(address)) {
    return addressCache.get(address);
  }
  
  try {
    const results = await geocoder.geocode({
      address: address + ', WA, USA',
      limit: 1
    });
    
    if (results && results.length > 0) {
      const { latitude, longitude } = results[0];
      const location = { latitude, longitude };
      addressCache.set(address, location);
      return location;
    }
  } catch (error) {
    console.error(`Error geocoding address ${address}:`, error);
  }
  
  return null;
}

// Find students within a specified radius (in miles) of a given student
async function findNearbyStudents(studentName, radiusMiles) {
  try {
    console.log('=== findNearbyStudents called ===');
    console.log('Searching for student:', studentName);
    console.log('Search radius (miles):', radiusMiles);
    console.log('Total students in database:', studentData.length);
    
    // Normalize the search name for comparison
    const searchName = studentName.toLowerCase().trim();
    console.log('Normalized search name:', searchName);
    
    // Find all students whose name or parent's name includes the search term
    const matchingStudents = studentData.filter(s => {
      // Check if the student's name matches
      const studentMatch = s.Student && s.Student.toLowerCase().includes(searchName);
      // Also check if the parent's name matches
      const parentMatch = s.Parent && s.Parent.toLowerCase().includes(searchName);
      
      if (studentMatch || parentMatch) {
        console.log('Potential match found - Student:', s.Student, '| Parent:', s.Parent);
        return true;
      }
      return false;
    });
    
    console.log(`Found ${matchingStudents.length} matching students`);
    
    if (matchingStudents.length === 0) {
      console.log('No matching students found for search:', searchName);
      throw new Error('No matching students found. Please try a different name.');
    }
    
    // For now, just use the first matching student
    // In a real app, you might want to show a list and let the user choose
    const student = matchingStudents[0];
    console.log('Selected student for proximity search:', student.Student, '| Address:', student.Address);
    
    // If we have coordinates, use them directly
    let studentCoords = null;
    if (student.Coordinates && student.Coordinates.latitude && student.Coordinates.longitude) {
      studentCoords = {
        latitude: student.Coordinates.latitude,
        longitude: student.Coordinates.longitude
      };
      console.log('Using existing coordinates:', studentCoords);
    } else {
      console.log('No coordinates found, geocoding address:', student.Address);
      // Otherwise, try to geocode the address
      studentCoords = await geocodeAddress(student.Address);
      if (!studentCoords) {
        console.error('Could not geocode address:', student.Address);
        throw new Error('Could not determine location for the specified student');
      }
      console.log('Geocoded coordinates:', studentCoords);
    }
    
    // Find nearby students
    const nearbyStudents = [];
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    
    console.log(`Searching for students within ${radiusMiles} miles of ${student.Student}`);
    
    for (const otherStudent of studentData) {
      // Skip the student themselves
      if (otherStudent.Student === student.Student) continue;
      
      let otherCoords = null;
      
      // Try to use existing coordinates first
      if (otherStudent.Coordinates && otherStudent.Coordinates.latitude && otherStudent.Coordinates.longitude) {
        otherCoords = {
          latitude: otherStudent.Coordinates.latitude,
          longitude: otherStudent.Coordinates.longitude
        };
      } else {
        // Fall back to geocoding
        console.log(`Geocoding address for ${otherStudent.Student}: ${otherStudent.Address}`);
        otherCoords = await geocodeAddress(otherStudent.Address);
        if (!otherCoords) {
          console.log(`Could not geocode address for ${otherStudent.Student}`);
          continue;
        }
      }
      
      // Calculate distance in meters
      const distance = getDistance(studentCoords, otherCoords);
      const distanceMiles = (distance / 1609.34);
      
      if (distance <= radiusMeters) {
        console.log(`Found nearby student: ${otherStudent.Student} (${distanceMiles.toFixed(2)} miles)`);
        nearbyStudents.push({
          name: otherStudent.Student,
          address: otherStudent.Address,
          parents: otherStudent.Parent || 'Not available',
          contact: otherStudent['Parent Contact'] || 'Not available',
          distance: distanceMiles.toFixed(2), // Convert to miles
          grade: otherStudent.Grade || 'Not specified'
        });
      }
    }
    
    // Sort by distance
    nearbyStudents.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    return {
      student: {
        name: student.Student,
        address: student.Address,
        parents: student.Parents || 'Not available',
        contact: student['Parent Contact'] || 'Not available',
        grade: student.Grade || 'Not specified',
        coordinates: studentCoords
      },
      nearbyStudents
    };
  } catch (error) {
    console.error('Error finding nearby students:', error);
    throw error;
  }
}

module.exports = {
  loadStudentData,
  findNearbyStudents
};
