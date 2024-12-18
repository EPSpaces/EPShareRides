const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  wlocation: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
