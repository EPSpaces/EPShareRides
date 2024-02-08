const express = require("express");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

let users = require("./database/users.json");
let events = require("./database/events.json");

// JWT secret
const token_secret = process.env["TOKEN_SECRET"];

// Connect to the database
mongoose.connect(process.env["MONGO_URI"])
.then(() => {
  console.log("Connected to db");
})
.catch((err) => {
  console.error("Error connecting to db:", err);
});

// Init Server
const app = express();

function authenticateToken(req, res, next) {
  const authHeader = req.headers && req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.redirect("/signin");
  }

  jwt.verify(token, token_secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.email = user.email;
    next();
  });
}

function getToken(req, res, next) {
  const token = req.cookies && req.cookies["authToken"];

  if (token) {
    req.headers["Authorization"] = `Bearer ${token}`;
  }

  next();
}

function ensureNoToken(req, res, next) {
  const token = req.cookies && req.cookies["authToken"];
  if (token != null) {
    return res.redirect("/");
  }
  next();
}

function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

function generateAccessToken(user) {
  return jwt.sign(user, token_secret, { expiresIn: "15m" });
}

function hashPassword(password) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);

  return bcrypt.hashSync(password, salt);
}

function comparePassword(password, email) {
  let hashedPassword;
  try {
    hashedPassword = users.find((u) => u.email === email).password;
  } catch (err) {
    return false;
  }

  return bcrypt.compareSync(password, hashedPassword);
}

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", getToken, authenticateToken, (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  const userInData = users.find((u) => u.email == email);

  firstName = userInData.firstName;
  lastName = userInData.lastName;

  let eventsP = events.filter((event) => event.email === email);

  res.render("index", { email, firstName, lastName, eventsP });
});

app.get("/signup", ensureNoToken, (req, res) => {
  res.render("signup", { error: req.query.err });
});

app.get("/signin", ensureNoToken, (req, res) => {
  res.render("signin", { error: req.query.err });
});

app.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.redirect("/signin");
});

app.get("/upcomingevents", getToken, authenticateToken, (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  const userInData = users.find((u) => u.email == email);

  firstName = userInData.firstName;
  lastName = userInData.lastName;
  res.render("upcomingevents", { email, firstName, lastName, events });
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

app.post("/event", getToken, authenticateToken, (req, res) => {
  const event = req.body;
  event.id = uuidv4();

  events.push(event);
  writeToJSON("./database/events.json", events);
});

app.get("/data/events", (req, res) => {
  res.json(events);
});

app.listen(80, () => {
  console.log("Server started on port 80");
});
