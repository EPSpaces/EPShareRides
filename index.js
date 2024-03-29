// Import libraries
const express = require("express");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { auth, requiresAuth } = require('express-openid-connect');

// Import Schemas from MongoDB
const User = require("./schemas/User.model.js");
const Event = require("./schemas/Event.model.js");
const Carpool = require("./schemas/Carpool.model.js");
const UserSettings = require("./schemas/UserSettings.model.js");

// Init Verification Code Cache
const verificationCodeCache = {};

// Import Util Functions
const {
  authenticateToken,
  getToken,
  ensureNoToken
} = require("./utils/authUtils");

// Init Auth0
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env['AUTH0_SECRET'],
  baseURL: 'https://17445d00-b6ba-4500-8021-591d9fc17d41-00-32xkadr8p7bn1.kirk.replit.dev',
  clientID: process.env['AUTH0_CLIENTID'],
  issuerBaseURL: 'https://dev-tmyd13ne4me12fr8.us.auth0.com'
};

// Import Routes
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

// Init Server
const app = express();

// Configure Server

if (process.env['MODE'] == 'DEV') {
  app.set("trust proxy", true); // Trust the first proxy
}
app.set("view engine", "ejs");
app.use(auth(config)); // Use Auth0
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Init Routes
app.use("/api", apiRoutes);
app.use("/", authRoutes);

app.get("/", getToken, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email });
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
  firstName = userInData['firstName'];
  lastName = userInData['lastName'];
  admin = userInData['admin'];

  res.render("index", { email, firstName, lastName, admin });
});

app.get("/sustainabilityStatement", (req, res) => {
  res.render("sustainabilityStatement");
});

app.get("/mycarpools", getToken, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email });
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

    firstName = userInData['firstName'];
  lastName = userInData['lastName'];

  res.render("mycarpools", { email, firstName, lastName });
});

app.get("/updateSettings", getToken, authenticateToken, async (req, res) => {
  res.render("updateSettings", { error: req.query.err, suc: req.query.suc });
});

app.get("/friends", getToken, authenticateToken, async (req, res) => {
  let people = [];
  let i = 0;
  let users;
  try {
    users = await User.find({}); 
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
    userInData = await User.findOne({ email });
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData['firstName'];
  lastName = userInData['lastName'];

  res.render("friends", { people, email, firstName, lastName });
});

// Setup 404 page
app.use((req, res) => {
  res.status(404).render("404");
});

// Connect to the database
mongoose
  .connect(process.env["MONGO_URI"])
  .then(() => {
    console.log("Connected to db");

    // Create the TTL index after the connection is established
    mongoose.connection.once('open', () => {
      const verificationCodeCollection = mongoose.connection.db.collection('VerificationCode');
      verificationCodeCollection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 300 }
      );
    });

    app.listen(process.env["PORT"], () => {
      console.log("Server started on port " + process.env["PORT"]);
    });
  })
  .catch((err) => {
    console.error("Error connecting to db:", err);
    return;
  });