const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  admin: { type: Boolean, default: false },
  address: { type: String, default: "none" },
  cell: { type: String, default: "none" },
  privacy: { type: Boolean, default: false },
  dark: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
