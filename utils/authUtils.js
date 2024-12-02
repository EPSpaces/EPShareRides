const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../schemas/User.model");

// Middleware to verify the token sent and set req.email to the user's email
function authenticateToken(req, res, next) {
  const authHeader = req.headers && req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.redirect("/signin");
  }

  jwt.verify(token, process.env["TOKEN_SECRET"], (err, user) => {
    if (err) {
      res.clearCookie("authToken");
      res.redirect("signin");
    }
    req.email = user.email;
    next();
  });
}

// Middleware to move the token from the cookie jar to the request header
function getToken(req, res, next) {
  const token = req.cookies && req.cookies["authToken"];

  if (token) {
    req.headers["Authorization"] = `Bearer ${token}`;
  }

  next();
}

// Middleware to only allow the user to proceed if they do not have a token
function ensureNoToken(req, res, next) {
  const token = req.cookies && req.cookies["authToken"];
  if (token != null) {
    return res.redirect("/");
  }
  next();
}

// Generate a JWT access token
function generateAccessToken(user) {
  return jwt.sign(user, process.env["TOKEN_SECRET"], { expiresIn: "60m" });
}

// Hash a password using bcrypt
function hashPassword(password) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
}

// Compare a password with the hashed password stored in the database
async function comparePassword(password, email) {
  let hashedPassword;
  let user;
  try {
    user = await User.findOne({ email });
  } catch (err) {
    console.error("Error getting passwords to compare passwords: " + err);
    return false;
  }

  if (!user) {
    return false;
  } else {
    let hashedPassword = user.password;
    if (!hashedPassword) {
      return false;
    }
    return bcrypt.compareSync(password, hashedPassword);
  }
}

// Compare a hash with the hashed password stored in the database
function comparePasswordHash(hash, email, users) {
  let hashedPassword;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return false;
      } else {
        let hashedPassword = user.password;
        if (hash == hashedPassword) return true;
        else return false;
      }
    })
    .catch((err) => {
      console.error("Error getting passwords to compare passwords: " + err);
      return false;
    });
}

// Send a verification code to the user's email using nodemailer
async function sendVerificationCode(email, verificationCode) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env["EMAIL_ADDRESS"],
      pass: process.env["EMAIL_PASSWORD"],
    },
  });

  const mailOptions = {
    from: process.env["EMAIL_ADDRESS"],
    to: email,
    subject: "EPShareRide - Verification Code: " + verificationCode,
    html:
      "<h3>The verification code for your new account on EPShareRide is " +
      verificationCode +
      "</h3>" +
      "<p>Note: If you did not request this, you can safely ignore this email</p>",
  };

  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    }
  });

  return verificationCode;
}

// Decode a token using Auth0's secret
function decodeAuth0(content) {
  return jwt.verify(content, process.env["AUTH0_SECRET"], {
    algorithms: ["RS256"],
  });
}

module.exports = {
  authenticateToken,
  getToken,
  ensureNoToken,
  generateAccessToken,
  hashPassword,
  comparePassword,
  comparePasswordHash,
  sendVerificationCode,
  decodeAuth0,
};