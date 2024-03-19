const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false }
});

const verificationCodeSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  code: { type: Number, required: true },
  user: userSchema,
  createdAt: { type: Date, required: true, expires: 300, default: Date.now } // 300 seconds = 5 minutes
});

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);