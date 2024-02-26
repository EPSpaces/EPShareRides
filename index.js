// Import libraries
const express = require("express");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

// Import data from JSON
let users = require("./database/users.json");
let points = require("./database/points.json");
let offerToCarpool = require("./database/offerToCarpool.json");

// Import Event schema for MongoDB
const Event = require("./schemas/Event");

// Init Verification Code Cache
const verificationCodeCache = {};


// Import Util Functions
const {
  authenticateToken,
  getToken,
  ensureNoToken,
} = require("./utils/authUtils");

// Import Routes
const authRoutes = require("./routes/authRoutes");

// Init Server
const app = express();

// Configure Server
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Init Routes
app.use("/", authRoutes);

app.get("/", getToken, authenticateToken, (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  const userInData = users.find((u) => u.email == email);

  firstName = userInData.firstName;
  lastName = userInData.lastName;

  Event.find({ email: email })
    .then((eventsP) => {
      res.render("index", { email, firstName, lastName, eventsP });
    })
    .catch((err) => {
      console.error("Error retrieving events:", err);
      res.status(500).send("Error retrieving events");
    });
});

app.get("/mycarpools", getToken, authenticateToken, async (req, res) => {
  const allEvents = await Event.find({});
  const email = req.email;
  let firstName;
  let lastName;

  const userInData = users.find((u) => u.email == email);

  firstName = userInData.firstName;
  lastName = userInData.lastName;

  res.render("mycarpools", { email, firstName, lastName, allEvents });
});

app.get("/updateSettings", getToken, authenticateToken, async (req, res) => {
  

  res.render("updateSettings", {});
});

app.get("/friends", getToken, authenticateToken, (req, res) => {
  let people = [];
  let i = 0;
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

  const userInData = users.find((u) => u.email == email);

  firstName = userInData.firstName;
  lastName = userInData.lastName;

  res.render("friends", { people, email, firstName, lastName });
});

app.post("/event", getToken, authenticateToken, (req, res) => {
  const event = req.body;

  createEvent(
    event.date,
    event.time,
    event.title,
    event.description,
    event.email,
  );
});

app.get("/api/points", (req, res) => {
  res.json(points);
});

app.get("/api/offerToCarpool", (req, res) => {
  res.json(offerToCarpool);
});

// Connect to the database
mongoose
  .connect(process.env["MONGO_URI"])
  .then(() => {
    console.log("Connected to db");
    app.listen(process.env["PORT"], () => {
      console.log("Server started on port " + process.env["PORT"]);
    });
  })
  .catch((err) => {
    console.error("Error connecting to db:", err);
    return;
  });


