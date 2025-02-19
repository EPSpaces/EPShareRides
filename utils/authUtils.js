const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../schemas/User.model");
const { getAuth } = require("firebase-admin/auth");

const auth = getAuth();

// Middleware to verify the token sent and set req.email to the user's email
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];

  if (token == null) {
    return res.redirect("/signin");
  }
  
  auth.verifyIdToken(idToken).then((decodedToken) => {
    console.log(decodedToken);
    next();
  })
  .catch((err) => {
    console.error(err);
  });
}

// Middleware to only allow the user to proceed if they do not have a token
function ensureNoToken(req, res, next) {
  const token = req.headers["authorization"];
  if (token != null) {
    console.log("HI");
    return res.redirect("/");
  }
  next();
}

module.exports = {
  authenticateToken,
  ensureNoToken,
  auth
};
