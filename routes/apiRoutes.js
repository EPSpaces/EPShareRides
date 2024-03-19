const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const { ensureNoToken,
      authenticateToken, getToken } = require("../utils/authUtils");

const User = require("../schemas/User.model.js");

const router = express.Router();

function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

router.get("/points", (req, res) => {
  let points = require("../database/points.json");
  res.json(points);
});

router.get("/offerToCarpool", (req, res) => {
  let offerToCarpool = require("./database/offerToCarpool.json");
  res.json(offerToCarpool);
});

router.put("/joinCarpool", getToken, authenticateToken, async (req, res) => {
  let carpools = require("../database/carpools.json");
  let { carpool, address } = req.body
  const email = req.email
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
  const newUser = {
    email: req.email,
    firstName,
    lastName,
    address
  }
  
  const carpoolIndex = carpools.findIndex(obj => obj.id == carpool);

  if (carpoolIndex == -1) {
    data[carpoolIndex].carpoolers.push(newUser);
  } else {
    res.status(404).send("Carpool not found");
  }

  writeToJSON("./database/carpools.json", carpools);
  res.status(200);
});

router.get("/events", (req, res) => {
  let events = require("../database/events.json");
  res.json(events);
});

router.post("/events", (req, res) => {
  const { firstName, lastName, eventName, wlocation, date, category } =
    req.body;
  const id = uuidv4();
  const newEvent = {
    firstName,
    lastName,
    eventName,
    wlocation,
    date,
    category,
    id,
  };
  let events = require("../database/events.json");
  events.push(newEvent);
  writeToJSON("./database/events.json", events);
});

router.get("/carpools", (req, res) => {
  let carpools = require("../database/carpools.json");
  res.json(carpools);
});

router.post("/carpools", (req, res) => {
  const {
    firstName,
    lastName,
    seats,
    route,
    wlocation,
    carpoolers,
    nameOfEvent,
    email,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !seats ||
    !route ||
    !wlocation ||
    !carpoolers ||
    !nameOfEvent ||
    !email
  ) {
    res.status(400);
    return;
  }

  const newcarpools = {
    firstName,
    lastName,
    seats,
    route,
    wlocation, //location is a used variable
    carpoolers,
    nameOfEvent,
    email,
    id: uuidv4(),
  };
  let carpools = require("../database/carpools.json");
  carpools.push(newcarpools);
  writeToJSON("./database/carpools.json", carpools);
});

module.exports = router;