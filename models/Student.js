const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentName: { type: String, required: true },
  grade: { type: String },
  address: { type: String, required: true },
  contactInfo: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

// Create a geospatial index for location-based queries
studentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Student', studentSchema);
