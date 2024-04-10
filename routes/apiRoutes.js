const express = require("express");
const fs = require("fs");

const { authenticateToken, getToken } = require("../utils/authUtils");

const User = require("../schemas/User.model.js");
const Event = require("../schemas/Event.model.js");
const ObjectId = require("mongodb").ObjectId;

const Carpool = require("../schemas/Carpool.model.js");

const router = express.Router();

function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

router.get("/points", getToken, authenticateToken, (req, res) => {
  let points = require("../database/points.json");
  res.json(points);
});

router.get("/offerToCarpool", getToken, authenticateToken, (req, res) => {
  let offerToCarpool = require("../database/offerToCarpool.json");
  res.json(offerToCarpool);
});

router.post("/joinCarpool", getToken, authenticateToken, async (req, res) => {
  let carpools;
  try {
    carpools = await Carpool.find({});
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
    return;
  }
  let { carpool, address } = req.body;
  let carpoolS = carpool;
  if (!carpoolS || !address) {
    res.status(400).send("Invalid request");
    return;
  }
  const email = req.email;
  let userInData;
  try {
    userInData = await User.findOne({ email });
    if (!userInData) {
      res.clearCookie("authToken");
      res.redirect(
        "/signin?err=Error with system finding User, please try again",
      );
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
  const newUser = {
    email: req.email,
    firstName,
    lastName,
    address,
  };
  try {
    carpool = await Carpool.findById(carpoolS);

    if (!carpool) {
      res.status(404).send("Carpool not found");
      return;
    }

    if (carpool.carpoolers.length >= carpool.seats) {
      res.status(400).send("Carpool is full");
      return;
    }

    const alreadyCarpoolerExists = carpool.carpoolers.some(
      (carpooler) => carpooler.email === req.email,
    );
    if (alreadyCarpoolerExists) {
      res.status(409).send("You are already in this carpool");
      return;
    }
    const updatedCarpool = await Carpool.findByIdAndUpdate(
      carpoolS,
      { $push: { carpoolers: newUser } },
      { new: true },
    );

    res.status(200).send(updatedCarpool);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
  res.status(200);
});

router.get("/events", getToken, authenticateToken, async (req, res) => {
  let events;
  try {
    events = await Event.find({});
  } catch (err) {
    console.error("Error getting events: " + err);
    res.status(500).send("Error getting events");
    return;
  }
  res.json(events);
});

router.post("/events", getToken, authenticateToken, async (req, res) => {
  const { eventName, wlocation, date, category, addressS } = req.body;

  if (!eventName || !wlocation || !date || !category || !addressS) {
    res.status(400).send("Bad Request");
    return;
  }
  let userInData;
  const email = req.email;
  try {
    userInData = await User.findOne({ email });
    if (!userInData) {
      res.clearCookie("authToken");
      res.redirect(
        "/signin?err=Error with verifing privileges, please try again",
      );
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("authToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }
  const { firstName, lastName, admin } = userInData;
  if (!admin) {
    res.sendStatus(401);
    return;
  }
  try {
    const newEvent = new Event({
      firstName,
      lastName,
      eventName,
      wlocation,
      addressS,
      date,
      category,
    });

    await newEvent.save();
  } catch (err) {
    console.error("Error saving event: " + err);
    res.status(500).send("Error saving event");
    return;
  }
  res.status(200).send("Event saved");
  return;
});

router.get("/carpools", getToken, authenticateToken, async (req, res) => {
  try {
    const carpools = await Carpool.find({});
    res.json(carpools);
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
  }
});

router.delete(
  "/carpools/:id",
  getToken,
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const carpools = await Carpool.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(carpools);
    } catch (err) {
      console.error("Error retrieving carpools: " + err);
      res.status(500).send("Error retrieving carpools");
    }
  },
);

// Route for deleting a carpooler
router.patch(
  "/carpools/deleteCarpooler",
  getToken,
  authenticateToken,
  async (req, res) => {
    try {
      const { _id, _id2 } = req.body;
      const carpools = await Carpool.updateOne(
        { _id: new ObjectId(_id2) },
        { $pull: { carpoolers: { _id: new ObjectId(_id) } } },
      );
      res.json(carpools);
    } catch (err) {
      console.error("Error updating carpools: " + err);
      res.status(500).send("Error updating carpools");
    }
  },
);

// Route for updating the route
router.patch(
  "/carpools/:id",
  getToken,
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params
      const { route, wlocation } = req.body;
      const carpools = await Carpool.updateOne(
        { _id: new ObjectId(id) },
        { $set: { route: route } },
        { $set: { wlocation: wlocation } },
      );
      res.json(carpools);
    } catch (err) {
      console.error("Error updating carpools: " + err);
      res.status(500).send("Error updating carpools");
    }
  },
);

router.patch(
  "/users/update",
  async (req, res) => {
    try {
      const { _id, address, privacy } = req.body;
      const users = await User.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { address: address, privacy: privacy } },
      );
      res.json(users);
    } catch (err) {
      console.error("Error updating user: " + err);
      res.status(500).send("Error updating user");
    }
  },
);

router.post("/carpools", getToken, authenticateToken, async (req, res) => {
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

  const newCarpool = new Carpool({
    firstName,
    lastName,
    seats,
    route,
    wlocation, //location is a used variable
    carpoolers,
    nameOfEvent,
    email,
  });

  try {
    await newCarpool.save();
  } catch (err) {
    console.error("Error creating new carpool: " + err);
    res.status(500).send("Error creating new carpool");
    return;
  }
  res.status(200).send("Carpool created");
});

router.get("/users", getToken, authenticateToken, async (req, res) => {
  let users;
  try {
    users = await User.find({});
  } catch (err) {
    console.error("Error getting users: " + err);
    res.status(500).send("Error getting users");
    return;
  }
  res.json(users);
});

module.exports = router;
