const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const VerificationCode = require('../schemas/VerificationCode.model');
const User = require('../schemas/User.model');

const router = express.Router();
const {
  ensureNoToken,
  authenticateToken,
  getToken,
  comparePassword,
  comparePasswordHash,
  hashPassword,
  generateAccessToken,
  sendVerificationCode,
} = require("../utils/authUtils");

router.get("/signup", ensureNoToken, (req, res) => {
  res.render("signup", { error: req.query.err });
});

router.get("/signin", ensureNoToken, (req, res) => {
  res.render("signin", { error: req.query.err, message: req.query.message });
});

router.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.redirect("/signin");
});

router.get("/deleteAccount", getToken, authenticateToken, (req, res) => {
  res.render("deleteAccount", { error: req.query.err });
});

router.post("/auth/signup", async (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password
  ) {
    res.redirect("/signup?err=Please fill in all fields");
    return;
  }

  let UserAlready;

  try {
    UserAlready = await User.findOne({ email: req.body.email });
  } catch (err) {
    console.error("Error finding user during verification cache: " + err);
    res.redirect("/signup?err=Error validating user creation, please try again");
    return;
  }
  if (UserAlready) {
     res.redirect("/signup?err=Email already exists");
     return;
  }
  
  const verificationCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  sendVerificationCode(req.body.email, verificationCode);
  const newVerificationCode = new VerificationCode({
    ip: req.ip,
    code: verificationCode,
    user: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashPassword(req.body.password),
      admin: false
    }
  });

  try {
    await newVerificationCode.save()
  } catch (err) {
    console.error("Error saving verification code for: " + req.body.email + "at ip: " + req.ip + "With this error: " + err);
    res.redirect("/signup?err=Error sending verification code, please try again");
    return;
  }
  
  res.redirect("/verification?email=" + req.body.email);
});

router.get("/verification", (req, res) => {
  res.render("verification", { email: req.query.email, error: req.query.err });
});

router.post("/auth/signupConfirm", async (req, res) => {
  const { email, code } = req.body;
  const ip = req.ip;

  if (!email || !code || !ip) {
    return res.redirect("/signup?err=Error Occured During Verification");
  }

  let verifyEntry;

  try {
    verifyEntry = await VerificationCode.findOne({
      'user.email': email,
      code: code,
      ip
    })
  } catch (err) {
    console.error("Error finding verification entry: " + err);
    res.redirect("/signup?Internal server error, please try again");
    return;
  }
  if (!verifyEntry) {
    res.redirect("/signup?err=Verification session timed out, please try again");
    return;
  }

  let entryToDelete;

  try {
    entryToDelete = await VerificationCode.findOneAndDelete({
      'user.email': email,
      code: code,
      ip
    })
  } catch (err) {
    console.error("Error finding ip cache after found: " + err);
    res.redirect("/verification?Internal server error, please try again&email=" + email);
    return;
  }
  
  if (!entryToDelete) {
      console.error("Error finding ip cache after found: " + err);
      res.redirect("/verification?Internal server error, please try again&email=" + email);
      return;
  }
  
  let user = verifyEntry.user;
  let userCheckIfExist;

  try {
    userCheckIfExist = await User.findOne({
      email
    })
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
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: user.password,
    admin: user.admin
  });

  newUser.save()
    .catch((err) => {
      console.error("Error creating user: " + err);
      res.redirect("/signup?err=Internal server error, please try again");
    });
  
  if (comparePasswordHash(user.password, email)) {
    const user = { email };

    const accessToken = generateAccessToken(user);

    res.cookie("authToken", accessToken, {
      httpOnly: true,
      maxAge: 3600000,
    });
    res.redirect("/");
  } else {
    res.redirect("/signin?err=Account created, error while signing in, please try to sign in");
  }
});

router.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  const comparePasswordBoolean = await comparePassword(password, email);

  if (comparePasswordBoolean) {
    const user = { email };

    const accessToken = generateAccessToken(user);

    res.cookie("authToken", accessToken, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/");
  } else {
    res.redirect("/signin?err=Invalid Email or Password");
  }
});

router.delete(
  "/auth/deleteAccount",
  getToken,
  authenticateToken,
  (req, res) => {
    const { password } = req.body;
    const email = req.email;
    res.clearCookie("authToken");
    if (comparePassword(password, email)) {
      User.findOneAndDelete({ email })
        .then((user) => {
          if (!user) {
            console.error("Error finding user to delete: " + err);
            res.redirect("/signin?err=Error deleting account, please sign in and try again");
            return;
          } else {
            res.redirect("/signin?message=Account deleted successfully");
            return;
          }
        })
        .catch((err) => {
          console.error("Error removing user: " + eer);
          res.redirect("/signin?err=Error deleting account, please sign in and try again");
          return;
        });
    } else {
      res.redirect("/deleteAccount?err=Password Incorrect");
    }
  },
);

module.exports = router;
