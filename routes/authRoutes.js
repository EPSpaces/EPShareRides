const express = require("express");
const User = require("../schemas/User.model");
const UserSettings = require("../schemas/UserSettings.model");
const jwt = require("jsonwebtoken");

const router = express.Router();
const {
  ensureNoToken,
  authenticateToken,
  getToken,
  generateAccessToken,
} = require("../utils/authUtils");

// Route to render the signin page
router.get("/signin", ensureNoToken, (req, res) => {
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
router.patch("/updateSettings", getToken, authenticateToken, async (req, res) => {
  const { settingId, newStatus } = req.body;
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

  res.redirect("/updateSettings?suc=Settings updated successfully");
});

// Route to handle callback for authentication
router.post("/callback", async (req, res) => {
  const user = jwt.verify(req.body.id_token, process.env["AUTH0_SECRET"], { algorithms: ['HS256'] });

  if (!user) {
    res.redirect("/login");
  }

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
      console.error("Error finding user with email to check if email exists: " + err);
      res.redirect("/signup?err=Internal server error, please try again");
      return;
    }

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

    newUser.save().catch((err) => {
      console.error("Error creating user: " + err);
      res.redirect("/signup?err=Internal server error, please try again");
      return;
    });
  }
});

module.exports = router;
