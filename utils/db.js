const sqlite3 = require('better-sqlite3');
const path = require('path');

// Initialize SQLite database
const db = new sqlite3(path.join(__dirname, '../carpool.db'));

// Function to find students near a given location
function findStudentsNearby(lat, lng, maxDistanceMiles = 1, excludeName = '') {
  // Earth's radius in miles
  const earthRadiusMiles = 3959;
  
  // Convert max distance to radians for the haversine formula
  const maxDistanceRadians = maxDistanceMiles / earthRadiusMiles;
  
  // Convert coordinates to radians for the query
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  
  // Prepare the query
  const query = `
    SELECT 
      id,
      name,
      parent_name as parentName,
      grade,
      address,
      contact_info as contactInfo,
      latitude,
      longitude,
      (? * acos(
        cos(?) * cos(latitude * ?) * 
        cos((longitude * ?) - ?) + 
        sin(?) * sin(latitude * ?)
      )) AS distance
    FROM 
      students
    WHERE 
      name != ?
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
    HAVING 
      distance < ?
    ORDER BY 
      distance
  `;
  
  // Execute the query
  const stmt = db.prepare(query);
  const results = stmt.all(
    earthRadiusMiles,
    latRad,
    Math.PI / 180, // Convert degrees to radians
    Math.PI / 180, // Convert degrees to radians
    lngRad,
    latRad,
    Math.PI / 180, // Convert degrees to radians
    excludeName,
    maxDistanceMiles
  );
  
  // Format the results
  return results.map(student => ({
    ...student,
    distance: student.distance.toFixed(2) + ' miles'
  }));
}

// Function to find a student by name
function findStudentByName(name) {
  const stmt = db.prepare('SELECT * FROM students WHERE name LIKE ? LIMIT 1');
  return stmt.get(`%${name}%`);
}

module.exports = {
  findStudentsNearby,
  findStudentByName,
  db // Export the db instance for other modules to use
};
