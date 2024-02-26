const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const router = express.Router();
const { ensureNoToken, authenticateToken, getToken, comparePassword, hashPassword, generateAccessToken, sendVerificationCode } = require("../utils/authUtils");

function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

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

router.get("/auth/signup", (req, res) => {
  const ipAddressCache = require("../database/ipAddressCache.json");
  ipAddressCache.push({ip: req.ip, code: sendVerificationCode(email)});
  writeToJSON("../database/ipAddressCache.json", ipAddressCache);
  res.status(200);
});

router.post("/auth/signupConfirm", (req, res) => {
  const { email, password, firstName, lastName, verificationCode } = req.body;

  if (!email || !password || !firstName || !lastName || !verificationCode) {
    return res.redirect("/signup?err=Please enter all fields");
  }

  
  const ipAddressCache = require("../database/ipAddressCache.json");
  
  const ipAddressesWithVerificationCode = ipAddressCache.find(ipObj => ipObj.code === verificationCode);

  if (!ipAddressesWithVerificationCode) {
    res.redirect("/signup?err=Incorrect Verification Code");
  } else {
    ipAddressCache = ipAddressCache.filter(ipObj => ipObj.code !== verificationCode)
    writeToJSON("../database/ipAddressCache.json", ipAddressCache)
  }

  const users = require("../database/users.json");
  const user = req.body;

  user.password = hashPassword(user.password);
  user.id = uuidv4();

  const existingUser = users.find((userA) => userA.email == user.email);

  if (existingUser) {
    res.redirect("/signup?err=Email Already In System");
  } else {
    users.push(user);
    writeToJSON("./database/users.json", users);
    res.redirect("/signin");
  }
});

router.post("/auth/signin", (req, res) => {
  const { email, password } = req.body;

  if (comparePassword(password, email, require("../database/users.json"))) {
    const user = { email };

    const accessToken = generateAccessToken(user);

    res.cookie("authToken", accessToken, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/");
  } else {
    res.redirect("/signin?err=Invalid Email or Password");
  }
});

router.delete("/auth/deleteAccount", getToken, authenticateToken, (req, res) => {
  const { password } = req.body;
  const email = req.email;
  if (comparePassword(password, email)) {
    const users = require("../database/users.json");
    const Changedusers = users.filter((user) => user.email != email);
    writeToJSON("./database/users.json", Changedusers);
    res.clearCookie("authToken");
    res.redirect("/signin?message=Account Deleted Successfully");
  } else {
    console.log(email, password);
    res.redirect("/deleteAccount?err=Password Incorrect");
  }
});

module.exports = router;