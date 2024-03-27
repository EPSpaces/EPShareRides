const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  showAccToOthers: { type: Boolean, default: true }
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);