const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Version', versionSchema);
