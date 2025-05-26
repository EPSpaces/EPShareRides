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
<<<<<<< HEAD
  address: { type: String, default: "none" },
=======
  address: { type: String, default: "My home address" },
>>>>>>> internot/main
  cell: { type: String, default: "none" },
  // Controls if they appear in the directory
  privacy: { type: Boolean, default: false },
  // Dark mode does not work yet
  dark: { type: Boolean, default: false },
});

// Export the User model
module.exports = mongoose.model("User", userSchema);
