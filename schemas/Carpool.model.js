const mongoose = require('mongoose');

const carpoolerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
});

const carpoolSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  seats: {
    type: Number,
    required: true
  },
  route: {
    type: String,
    required: true,
    trim: true
  },
  wlocation: {
    type: String,
    required: true,
    trim: true
  },
  carpoolers: {
    type: [carpoolerSchema],
    required: true
  },
  nameOfEvent: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  id: {
    type: String,
    required: true,
    trim: true
  }
});

const Carpool = mongoose.model('Carpool', carpoolSchema);

module.exports = Carpool;
