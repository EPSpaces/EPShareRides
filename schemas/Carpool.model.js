// Purpose: Define the schema for the Carpool model.
const mongoose = require('mongoose');

// Define the schema for the Carpool model
const carpoolerSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  address: String
});

// Define the schema for the Carpool model
const carpoolSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  carMake: String,
  seats: Number,
  route: String,
  wlocation: String,
  carpoolers: [carpoolerSchema],
  pendingRequests: [carpoolerSchema],
  nameOfEvent: String,
  userEmail: String,
  arrivalTime: String,
  id: String,
});

// Create the Carpool model
const Carpool = mongoose.model('Carpool', carpoolSchema);

// Export the Carpool model
module.exports = Carpool;