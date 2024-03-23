const mongoose = require('mongoose');

const carpoolerSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  address: String
});

const carpoolSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  seats: Number,
  route: String,
  wlocation: String,
  carpoolers: [carpoolerSchema],
  nameOfEvent: String,
  email: String,
  id: String
});

const Carpool = mongoose.model('Carpool', carpoolSchema);

module.exports = Carpool;
