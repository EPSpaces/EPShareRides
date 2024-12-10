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
  res.render("signin", { error: req.query.err, message: req.query.message });
});

router.get('/login/microsoft', (req, res) => {
  const authorizeUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent('https://vigilant-telegram-x54r99j7p69h4r5-3000.app.github.dev/mscallback')}&scope=openid%20email%20profile&response_mode=query`;

  res.redirect(authorizeUrl);
})

router.get('/mscallback', async (req, res) => {
  const code = req.query.code;

  // Exchange code for tokens
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://vigilant-telegram-x54r99j7p69h4r5-3000.app.github.dev/mscallback'
    })
  });

  const tokens = await tokenResponse.json();

  // tokens now contain id_token which you can verify
  const idToken = tokens.id_token;

  // Verify id_token using a library. For OIDC, you typically use jwks-rsa or openid-client
  // For demonstration, let's assume we have a function verifyToken.
  
  const userClaims = await verifyToken(idToken, `${process.env.MICROSOFT_ISSUER_BASE_URL}/v2.0/.well-known/openid-configuration`);
  
  const email = userClaims.email;
  // Now do the logic you have: find or create user, set cookie, redirect.

  console.log(email);
});

// Route to log out the user and clear the auth token
router.get("/logout", (req, res) => {
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
  // const state = jwt.verify(req.body.state, process.env["AUTH0_SECRET"], { algorithms: ['HS256'] });

  if (!user) {
    res.redirect("/login");
  }

  const { email } = user;

  let alreadyUser;

  try {
    alreadyUser = await User.findOne({ email });
  } catch (err) {
    res.status(500).send("An error occurred");
    return;
  }

  if (alreadyUser) {
    const user = { email };

    const accessToken = generateAccessToken(user);

    res.cookie("authToken", accessToken, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/");
  } else {
    let userCheckIfExist;

    try {
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
  })
  }
});

module.exports = router;