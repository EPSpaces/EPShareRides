const express = require('express');
const router = express.Router();
const { findStudentsNearby, findStudentByName } = require('../utils/db');

// Search for nearby students
router.post('/search', async (req, res) => {
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
        distance: s.distance
      }))
    });
    
  } catch (err) {
    console.error('Error in find-rides search:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
