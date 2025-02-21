// Purpose: Handle all routes related to authentication
// Create the express router and import the User and UserSettings schemas
const express = require("express");
const User = require("../schemas/User.model");
const UserSettings = require("../schemas/UserSettings.model");
// Import the jsonwebtoken package
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const {
  ensureNoToken,
  authenticateToken
} = require("../utils/authUtils.js");
// Create the express router
const router = express.Router();

// Home route - Render home page with user information
// Simple rate limiter to prevent abuse
const homeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Route to render the signin page
router.get("/signin", homeLimiter, ensureNoToken, (req, res) => {
  res.render("signin", { error: req.query.err, message: req.query.message });
});

// Route to log out the user and clear the auth token
router.get("/logout", (req, res) => {
  // Clear the auth token cookie and redirect to signin page
  res.clearCookie("idToken");
  res.redirect("/signin?message=You have been signed out.");
});

// Route to handle user sign in
module.exports = router;
