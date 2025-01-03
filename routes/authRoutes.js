// Purpose: Handle all routes related to authentication
// Create the express router and import the User and UserSettings schemas
const express = require("express");
const User = require("../schemas/User.model");
const UserSettings = require("../schemas/UserSettings.model");
// Import the jsonwebtoken package
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

// Create the express router
const router = express.Router();
const {
  ensureNoToken,
  authenticateToken,
  getToken,
  generateAccessToken,
} = require("../utils/authUtils");

// Home route - Render home page with user information
// Simple rate limiter to prevent abuse
const homeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Route to render the signin page
router.get("/signin", homeLimiter, ensureNoToken, (req, res) => {
  // Render the signin page with error and message parameters
  res.render("signin", { error: req.query.err, message: req.query.message });
});

// Route to log out the user and clear the auth token
router.get("/logout", (req, res) => {
  // Clear the auth token cookie and redirect to signin page
  res.clearCookie("authToken");
  res.redirect("/signin");
});

// Route to handle updating user settings
router.patch("/updateSettings", homeLimiter, getToken, authenticateToken, async (req, res) => {
  // Get the settingId and newStatus from the request body
  const { settingId, newStatus } = req.body;
  // Check if the settingId and newStatus are not empty
  if (!settingId || !newStatus) {
    res.redirect("/updateSettings?err=Please fill in all fields");
    return;
  }

  try {
    // Update the user settings in the database
    await UserSettings.findOneAndUpdate(
      { userEmail: req.email },
      { $set: { [settingId]: newStatus } },
      { new: true },
    );
  } catch (err) {
    console.error("Error updating settings: " + err);
    res.redirect("/updateSettings?err=Error updating settings, please try again");
    return;
  }
  // Redirect to the update settings page with a success message
  res.redirect("/updateSettings?suc=Settings updated successfully");
});

// Route to handle callback for authentication
router.post("/callback", homeLimiter, async (req, res) => {
  // Verify the user token with the AUTH0_SECRET using HS256 algorithm because why not
  const user = jwt.verify(req.body.id_token, process.env["AUTH0_SECRET"], { algorithms: ['HS256'] });

  // Check if the user exists cause if they don't it's a problem
  if (!user) {
    res.redirect("/login");
  }

  // Get the user email from the user object
  const { email } = user;

  let alreadyUser;

  try {
    // Check if the user already exists in the database
    alreadyUser = await User.findOne({ email });
  } catch (err) {
    res.status(500).send("An error occurred");
    return;
  }

  if (alreadyUser) {
    const user = { email };

    // Generate an access token for the user
    const accessToken = generateAccessToken(user);

    // Set the auth token cookie and redirect to home page
    res.cookie("authToken", accessToken, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/");
  } else {
    let userCheckIfExist;

    try {
      // Check if the user email already exists in the database
      userCheckIfExist = await User.findOne({
        email,
      });
    } catch (err) {
      // Log the error and redirect to the signup page with an error message
      console.error("Error finding user with email to check if email exists: " + err);
      res.redirect("/signup?err=Internal server error, please try again");
      return;
    }

    // Check if the user already exists in the database
    if (userCheckIfExist) {
      res.redirect("/signup?err=Email already exists");
      return;
    }

    // Create a new user in the database
    const newUser = new User({
      firstName: user.nickname,
      lastName: user.nickname,
      email: user.email,
      admin: false,
      address: false,
      privacy: false,
    });

    // Save the new user to the database
    newUser.save().catch((err) => {
      // Log the error and redirect to the signup page with an error message
      console.error("Error creating user: " + err);
      // Redirect to the signup page with an error message
      res.redirect("/signup?err=Internal server error, please try again");
      return;
    });
  }
});

// Route to handle user sign in
module.exports = router;
