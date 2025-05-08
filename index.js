if (process.env.MODE != 'PROD') {
  require('dotenv').config(); // Load environment variables from .env file in non-production mode
}

// Import libraries
const express = require("express");
const ejs = require("ejs");
const axios = require("axios").default;
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Import Schemas from MongoDB
const User = require("./schemas/User.model.js");
const Event = require("./schemas/Event.model.js");
const Carpool = require("./schemas/Carpool.model.js");
const UserSettings = require("./schemas/UserSettings.model.js");

// Initialize Firebase app
const firebaseadmin = require('firebase-admin');
var serviceAccount = require("./service_account.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./service_account.json";

firebaseadmin.initializeApp({
  credential: firebaseadmin.credential.cert(serviceAccount)
});

// Import Util Functions
const {
  authenticateToken,
} = require("./utils/authUtils");

// Initialize Express server
const app = express();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

// Import Rate Limiter
const rateLimit = require('express-rate-limit');

app.set("view engine", "ejs"); // Set view engine to EJS
app.use(express.json()); // Parse JSON requests
app.use(express.static(__dirname + "/public")); // Serve static files
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: "100mb" })); // Set JSON body limit to 100mb
app.use(express.urlencoded({ extended: true, limit: "100mb" })); // Parse URL-encoded bodies with limit
app.use('/api/', apiRoutes); //TODO: Put apiRoutes under /api
app.use('/', authRoutes);

// Home route - Render home page with user information
// Simple rate limiter to prevent abuse
const homeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.get("/", homeLimiter, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email }); // Find user by email
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];
  admin = userInData["admin"];

  res.render("index", { email, firstName, lastName, admin }); // Render home page
});

// Sustainability statement route
app.get("/sustainabilityStatement", (req, res) => {
  res.render("sustainabilityStatement"); // Render sustainability statement page
});

// My carpools route - Render user's carpools
app.get("/mycarpools", homeLimiter, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email }); // Find user by email
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];

  res.render("mycarpools", {
    email,
    firstName,
    lastName,
    message: req.query.message,
    error: req.query.error,
  }); // Render my carpools page
});

// Update settings route - Allow user to update their settings
app.get("/updateSettings", homeLimiter, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email });;
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];

  res.render("updateSettings", { email, firstName, lastName }); // Render update settings page
});

// Friends route - Display list of all users
app.get("/friends", homeLimiter, authenticateToken, async (req, res) => {
  let people = [];
  let i = 0;
  let users;
  try {
    users = await User.find({}); // Find all users
  } catch (err) {
    res.clearCookie("idToken");
    res.status(500).send("Error retrieving users");
  }
  users.forEach((u) => {
    let newPerson = {};
    newPerson.firstName = u.firstName;
    newPerson.lastName = u.lastName;
    newPerson.email = u.email;
    people.push(newPerson);
    i++;
  });

  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email });;
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];

  res.render("friends", { people, email, firstName, lastName }); // Render friends page
});

// Setup 404 page - Handle undefined routes
app.use((req, res) => {
  res.status(404).render("404"); // Render 404 page
});

// Configure nodemailer (replace with your SMTP credentials)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Cron job: every 5 minutes, check for carpools 2 hours from now
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  // Find carpools where arrivalTime is within 5 minutes of two hours from now, and not already locked
  const carpools = await Carpool.find({
    arrivalTime: { $gte: twoHoursLater.toISOString(), $lt: new Date(twoHoursLater.getTime() + 5 * 60 * 1000).toISOString() },
    'pendingRequests.0': { $exists: true }
  });
  for (const carpool of carpools) {
    // Close signups: clear pendingRequests
    carpool.pendingRequests = [];
    await carpool.save();
    // Gather emails
    const emails = [carpool.email, ...carpool.carpoolers.map(c => c.email)];
    // Compose email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: emails.join(','),
      subject: 'Carpool Reminder: ' + (carpool.nameOfEvent || ''),
      text: `Reminder: Your carpool for event ${carpool.nameOfEvent || ''} is scheduled to arrive at ${carpool.arrivalTime}.

Driver: ${carpool.firstName} ${carpool.lastName}
Car: ${carpool.carMake}
Pickup: ${carpool.wlocation}
If you have questions, contact your driver at ${carpool.email} or ${carpool.phone}.
`
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.error('Failed to send carpool reminder email:', e);
    }
  }
});

// Connect to the database and start the server
mongoose
  .connect(process.env["MONGO_URI"]) // Connect to MongoDB
  .then(() => {
    console.log("Connected to db");

    app.listen(process.env["PORT"], () => {
      console.log("Server started on port " + process.env["PORT"]); // Start server
    });
  })
  .catch((err) => {
    console.error("Error connecting to db:", err);
    return;
  });
