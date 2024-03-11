const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

async function loadJSONFile(filePath) {
  try {
    const fileData = await fs.promises.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);
    return jsonData;
  } catch (err) {
    console.error('Error reading or parsing JSON file:', err);
    throw err;
  }
}

const router = express.Router();
const {
  ensureNoToken,
  authenticateToken,
  getToken,
  comparePassword,
  hashPassword,
  generateAccessToken,
  sendVerificationCode,
} = require("../utils/authUtils");

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

router.post("/auth/signup", (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password
  ) {
    res.redirect("/signup?err=Please fill in all fields");
  }
  let ipCache = require("../database/ipCache.json");
  ipCache = ipCache.filter((obj) => obj.user.email !== req.body.email);
  const verificationCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  sendVerificationCode(req.body.email, verificationCode);
  ipCache.push({
    ip: req.ip,
    code: verificationCode,
    user: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashPassword(req.body.password),
    },
  });
  writeToJSON("./database/ipCache.json", ipCache);
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

  let ipCache = await loadJSONFile("./database/ipCache.json");

  console.log(ipCache);

  const ipAddressesWithVerificationCode = ipCache.find((ipObj) => ipObj.code === code);

  console.log(ipAddressesWithVerificationCode);

  ipCache = ipCache.filter((ipObj) => ipObj.user.email != email);
  writeToJSON("./database/ipCache.json", ipCache);

  if (!ipAddressesWithVerificationCode) {
    res.redirect("/signup?err=Incorrect Verification Code");
  } else {
    ipCache = ipCache.filter((ipObj) => ipObj.code !== code);
    writeToJSON("./database/ipCache.json", ipCache);

    const users = require("../database/users.json");
    const user = ipCache.find((ipObj) => ipObj.email === email).user;

    const existingUser = users.find((userA) => userA.email == user.email);

    if (existingUser) {
      res.redirect("/signup?err=Email Already In System");
    } else {
      users.push(user);
      writeToJSON("./database/users.json", users);
      if (comparePassword(password, email, require("../database/users.json"))) {
        const user = { email };

        const accessToken = generateAccessToken(user);

        res.cookie("authToken", accessToken, {
          httpOnly: true,
          maxAge: 3600000,
        });
        res.redirect("/");
      } else {
        res.redirect("/signin?err=Invalid Email or Password");
      }
    }
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

router.delete(
  "/auth/deleteAccount",
  getToken,
  authenticateToken,
  (req, res) => {
    const { password } = req.body;
    const email = req.email;
    if (comparePassword(password, email)) {
      const users = require("./database/users.json");
      const Changedusers = users.filter((user) => user.email != email);
      writeToJSON("./database/users.json", Changedusers);
      res.clearCookie("authToken");
      res.redirect("/signin?message=Account Deleted Successfully");
    } else {
      console.log(email, password);
      res.redirect("/deleteAccount?err=Password Incorrect");
    }
  },
);

module.exports = router;