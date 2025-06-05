// Purpose: Define the schema for the Carpool model.
const mongoose = require('mongoose');

// Define the schema for the Carpool model
const carpoolerSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  address: String,
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  co2Savings: {
    type: Number,
    default: 0
  }
});

// Define the schema for the Carpool model
const carpoolSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  carMake: String,
  seats: {
    type: Number,
    required: true,
    min: 1
  },
  route: String,
  wlocation: String,
  carpoolers: [carpoolerSchema],
  pendingRequests: [carpoolerSchema],
  nameOfEvent: String,
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  arrivalTime: String,
  id: String,
  // CO2 Savings related fields
  distanceMiles: {
    type: Number,
    min: 0,
    default: 10 // Default to 10 miles if not provided
  },
  co2Savings: {
    type: Number,
    default: 0,
    min: 0
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Category of the carpool (sports, academic, social, other)
  category: {
    type: String,
    enum: ['sports', 'academic', 'social', 'other'],
    default: 'other'
  }
});

// Update the updatedAt field before saving
carpoolSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create the Carpool model
const Carpool = mongoose.model('Carpool', carpoolSchema);

// Export the Carpool model
module.exports = Carpool;