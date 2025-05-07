const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../schemas/User.model");
const { getAuth } = require("firebase-admin/auth");

const auth = getAuth();

// Middleware to verify the token sent and set req.email to the user's email
function authenticateToken(req, res, next) {
  let idToken = req.cookies["idToken"];
  
  if (idToken == null) {
    return res.redirect("/signin");
  }

  auth.verifyIdToken(idToken).then((decodedToken) => {
    req.email = decodedToken.email;
    next();
  })
  .catch((err) => {
    console.error(err);
    res.clearCookie("idToken");
    res.redirect("/signin");
  });
}

// Middleware to only allow the user to proceed if they do not have a token
function ensureNoToken(req, res, next) {
  let idToken = req.cookies["idToken"];;
  
  if (idToken != null) {
    return res.redirect("/");
  }
  next();
}

module.exports = {
  authenticateToken,
  ensureNoToken,
  auth
};
