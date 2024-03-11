const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Verify token sent and set req.email to the user's email
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

// Move the token from the cookie jar to the request header
function getToken(req, res, next) {
  const token = req.cookies && req.cookies["authToken"];

  if (token) {
    req.headers["Authorization"] = `Bearer ${token}`;
  }

  next();
}

// Only allows the user to go through if they do not have a token
function ensureNoToken(req, res, next) {
  const token = req.cookies && req.cookies["authToken"];
  if (token != null) {
    return res.redirect("/");
  }
  next();
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env["TOKEN_SECRET"], { expiresIn: "60m" });
}

function hashPassword(password) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);

  return bcrypt.hashSync(password, salt);
}

function comparePassword(password, email, users) {
  let hashedPassword;
  try {
    hashedPassword = users.find((u) => u.email === email).password;
  } catch (err) {
    return false;
  }

  return bcrypt.compareSync(password, hashedPassword);
}

function comparePasswordHash(hash, email, users) {
  try {
    hashedPassword = users.find((u) => u.email === email).password;
  } catch(err) {
    return false;
  }

  if (hash == hashedPassword) return true;
  else return false;
}

async function sendVerificationCode(email, verificationCode) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env["EMAIL_ADDRESS"],
      pass: process.env["EMAIL_PASSWORD"],
    }
  });

  const mailOptions = {
    from: process.env["EMAIL_ADDRESS"],
    to: email,
    subject: "EPShareRide - Verification Code: " + verificationCode,
    html: "<h3>The verification code for your new account on EPShareRide is " + verificationCode + "</h3>" + "<p>Note: If you did not request this, you can safely ignore this email</p>"
  };

  await transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    }
  });

  return verificationCode;
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
};
