// Purpose: Define the schema for the User model.
const mongoose = require("mongoose");

// Define the schema for the User model
const Schema = mongoose.Schema;

// Define the schema for the User model
const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  admin: { type: Boolean, default: false },
  address: { type: String, default: "My home address" },
  cell: { type: String, default: "none" },
  // Controls if they appear in the directory
  privacy: { type: Boolean, default: false },
  // Dark mode does not work yet
  dark: { type: Boolean, default: false },
  // Track CO2 savings in kg (legacy field, use totalCO2Savings instead)
  co2Saved: { type: Number, default: 0 },
  // Track total CO2 savings across all carpools in kg
  totalCO2Savings: { type: Number, default: 0 }
});

// Export the User model
module.exports = mongoose.model("User", userSchema);
