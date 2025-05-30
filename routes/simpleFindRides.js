const express = require('express');
const router = express.Router();
const { findStudentsNearby, findStudentByName } = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

// Simple find rides route - requires authentication
router.get('/', authenticateToken, (req, res) => {
  // Get user info from the token
  const { email, firstName, lastName, admin } = req.user;
  
  res.render('findRides', { 
    title: 'Find Rides',
    email,
    firstName,
    lastName,
    admin,
    currentPage: 'find-rides'
  });
});

// API endpoint for finding rides
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { studentName, maxDistance = 1 } = req.body; // maxDistance in miles
    
    // Find the student
    const student = await findStudentByName(studentName);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if student has valid coordinates
    if (!student.latitude || !student.longitude) {
      return res.status(400).json({ 
        error: 'Student address could not be geocoded. Please update the address.' 
      });
    }
    
    // Find nearby students
    const nearbyStudents = await findStudentsNearby(
      parseFloat(student.latitude),
      parseFloat(student.longitude),
      parseFloat(maxDistance),
      student.name
    );
    
    // Format the response
    res.json({
      student: {
        name: student.name,
        address: student.address,
        grade: student.grade
      },
      nearbyStudents: nearbyStudents.map(s => ({
        name: s.name,
        parentName: s.parentName,
        grade: s.grade,
        address: s.address,
        contactInfo: s.contactInfo,
        distance: s.distance.toFixed(2) + ' miles'
      }))
    });
    
  } catch (error) {
    console.error('Error in find-rides search:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
