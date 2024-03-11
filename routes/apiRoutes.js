const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

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

router.get("/events", (req, res) => {
  let events = require("../database/events.json");
  res.json(events);
});

router.post("/events", (req, res) => {
  const { firstName, lastName, eventName, location, data, category } = req.body;
  const id = uuidv4();
  const newEvent = {
    firstName,
    lastName,
    eventName,
    location,
    data,
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
  const { firstName, lastName, seats, route, location } = req.body;
  const newcarpools = {
    firstName,
    lastName,
    seats,
    route,
    location
  };
  let carpools = require("../database/carpools.json");
  carpools.push(newcarpools);
  writeToJSON("./database/carpools.json", carpools);
});

module.exports = router;

module.exports = router;
