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
const { auth } = require("express-openid-connect");

// Import Schemas from MongoDB
const User = require("./schemas/User.model.js");
const Event = require("./schemas/Event.model.js");
const Carpool = require("./schemas/Carpool.model.js");
const UserSettings = require("./schemas/UserSettings.model.js");

// Import Util Functions
const {
  authenticateToken,
  getToken,
  ensureNoToken,
} = require("./utils/authUtils");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

// Initialize Express server
const app = express();

// Configure Auth0 Server settings
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env["AUTH0_SECRET"],
  baseURL: process.env["BASE_URL"],
  clientID: process.env["AUTH0_CLIENTID"],
  issuerBaseURL: "https://dev-1tui2vdlhhsdtl30.us.auth0.com",
};

app.set("trust proxy", true); // Trust the first proxy
app.set("view engine", "ejs"); // Set view engine to EJS
app.use(express.json()); // Parse JSON requests
app.use(express.static(__dirname + "/public")); // Serve static files
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: "100mb" })); // Set JSON body limit to 100mb
app.use(express.urlencoded({ extended: true, limit: "100mb" })); // Parse URL-encoded bodies with limit

// Initialize routes
app.use("/api", apiRoutes); // Use API routes
app.use("/", authRoutes);  // Use auth routes

app.use(auth(config)); // Use auth middleware with config

// Home route - Render home page with user information
app.get("/", getToken, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email }); // Find user by email
    if (!userInData) {
      res.clearCookie("authToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
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
app.get("/mycarpools", getToken, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email }); // Find user by email
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
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
app.get("/updateSettings", getToken, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email }); // Find user by email
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];

  res.render("updateSettings", { email, firstName, lastName }); // Render update settings page
});

// Friends route - Display list of all users
app.get("/friends", getToken, authenticateToken, async (req, res) => {
  let people = [];
  let i = 0;
  let users;
  try {
    users = await User.find({}); // Find all users
  } catch (err) {
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
    userInData = await User.findOne({ email }); // Find user by email
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
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
