// Import libraries
const express = require("express");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

// Import data from JSON
let users = require("./database/users.json");
let points = require("./database/points.json");

// Import Event schema for MongoDB
const Event = require("./schemas/Event");

// Import Util Functions
const { authenticateToken, getToken, ensureNoToken, generateAccessToken, hashPassword, comparePassword } = require("./utils/authUtils");

// Import Routes
const authRoutes = require("./routes/authRoutes");

// Init Server
const app = express();

function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

const createEvent = async (date, time, title, description, email) => {
  try {
    const event = new Event({ date, time, title, description, email });
    await event.save();
    return true;
  } catch (error) {
    console.error("Error creating event:", error);
    return false;
  }
};

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
app.get("/signup", ensureNoToken, (req, res) => {
  res.render("signup", { error: req.query.err });
});

app.get("/signin", ensureNoToken, (req, res) => {
  res.render("signin", { error: req.query.err, message: req.query.message });
});

app.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.redirect("/signin");
});

app.get("/deleteAccount", getToken, authenticateToken, (req, res) => {
  res.render("deleteAccount", { error: req.query.err });
});

app.get("/upcomingevents", getToken, authenticateToken, async (req, res) => {
  const allEvents = await Event.find({});
  const email = req.email;
  let firstName;
  let lastName;

  const userInData = users.find((u) => u.email == email);

  firstName = userInData.firstName;
  lastName = userInData.lastName;

  res.render("upcomingevents", { email, firstName, lastName, allEvents });
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

app.post("/auth/signup", (req, res) => {
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

app.post("/auth/signin", (req, res) => {
  const { email, password } = req.body;

  if (comparePassword(password, email)) {
    const user = { email };

    const accessToken = generateAccessToken(user);

    res.cookie("authToken", accessToken, { httpOnly: true, maxAge: 3600000 });
    res.redirect("/");
  } else {
    res.redirect("/signin?err=Invalid Email or Password");
  }
});

app.delete("/auth/deleteAccount", getToken, authenticateToken, (req, res) => {
  const { password } = req.body;
  const email = req.email;
  if (comparePassword(password, email)) {
    users = users.filter((user) => user.email != email);
    writeToJSON("./database/users.json", users);
    res.clearCookie("authToken");
    res.redirect("/signin?message=Account Deleted Successfully");
  } else {
    console.log(email, password);
    res.redirect("/deleteAccount?err=Password Incorrect");
  }
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
