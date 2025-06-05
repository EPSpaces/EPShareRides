// Purpose: Define the schema for the UserSettings collection in the database.
const mongoose = require('mongoose');

// Define the schema for the UserSettings collection in the database.
const userSettingsSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  showAccToOthers: { type: Boolean, default: true },
  interests: {
    type: [{
      type: String,
      enum: ['sports', 'academic', 'social', 'other'],
    }],
    default: []
  }
});

// Export the UserSettings model.
module.exports = mongoose.model('UserSettings', userSettingsSchema);