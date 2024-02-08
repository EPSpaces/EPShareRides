const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  date: String,
  time: String,
  title: String,
  description: String,
  email: String
});

module.exports = mongoose.model('Event', eventSchema);