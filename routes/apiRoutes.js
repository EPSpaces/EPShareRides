const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");

const { authenticateToken, getToken } = require("../utils/authUtils");

const User = require("../schemas/User.model.js");
const Event = require("../schemas/Event.model.js");
const ObjectId = require("mongodb").ObjectId;

const Carpool = require("../schemas/Carpool.model.js");

const router = express.Router();

// Function to write data to a JSON file
function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

// Route to get points data
router.get("/points", getToken, authenticateToken, (req, res) => {
  let points = require("../database/points.json");
  res.json(points);
});

// Route to get offer to carpool data
router.get("/offerToCarpool", getToken, authenticateToken, (req, res) => {
  let offerToCarpool = require("../database/offerToCarpool.json");
  res.json(offerToCarpool);
});

// Route to join a carpool
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

// Route to get all events
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

// Route to create a new event
router.post("/events", getToken, authenticateToken, async (req, res) => {
  const { eventName, wlocation, date, category, addressToPut } = req.body;
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
      address: addressToPut,
      date,
      category,
    });

    console.log(newEvent);

    await newEvent.save();
  } catch (err) {
    console.error("Error saving event: " + err);
    res.status(500).send("Error saving event");
    return;
  }
  res.status(200).send("Event saved");
  return;
});

// Route to get all carpools
router.get("/carpools", getToken, authenticateToken, async (req, res) => {
  try {
    const carpools = await Carpool.find({});
    res.json(carpools);
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
  }
});

// Route to get user's carpools
router.get("/userCarpools", getToken, authenticateToken, async (req, res) => {
  let carpools = [];
  try {
    const carpoolsCreated = await Carpool.find({ email: req.email }).exec();
    const carpoolsJoined = await Carpool.find({
      "carpoolers.email": req.email,
    }).exec();
    carpools = [...carpoolsCreated, ...carpoolsJoined];
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
    return;
  }
  res.json(carpools);
});

// Route to get the route for a specific carpool
router.get("/mapRoute/:id", getToken, authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).send("Bad Request");
    return;
  }

  let carpool;

  try {
    carpool = await Carpool.findById(id);
  } catch (err) {
    console.error("Error retrieving carpool: " + err);
    res.status(500).send("Error retrieving carpool");
    return;
  }

  let final;

  try {
    final = await Event.findById(
      new mongoose.Types.ObjectId(carpool.nameOfEvent),
    );
    final = final.address;
  } catch (err) {
    console.error("Error retrieving event: " + err);
    res.status(500).send("Error retrieving event");
    return;
  }

  if (carpool.route == "point") {
    res.json({
      final,
      stops: [carpool.wlocation],
    });
  } else {
    let addresses = [];
    carpool.carpoolers.forEach((carpooler) => {
      addresses.push(carpooler.address);
    });
    res.json({
      final,
      stops: addresses,
    });
  }
});

// Route to get communication details for the users in a carpool
router.get(
  "/carpoolUserCommunication/:id",
  getToken,
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("Bad Request");
      return;
    }

    let carpoolId;
    try {
      carpoolId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      res.status(400).send("Bad Request");
      return;
    }

    let userCommunication = [];

    try {
      const carpoolOwnerEmailE = await Carpool.findById(carpoolId);
      const carpoolOwnerEmail = carpoolOwnerEmailE.email;

      const carpoolOwnerCell = await User.findOne({ email: carpoolOwnerEmail })
        .cell;

      if (carpoolOwnerCell == undefined || carpoolOwnerCell == "none") {
        userCommunication.push(carpoolOwnerEmail);
      } else {
        userCommunication.push(carpoolOwnerCell);
      }

      const carpoolersInfoO = await Carpool.findById(carpoolId).exec();

      const carpoolersInfo = carpoolersInfoO.carpoolers;

      for (const c of carpoolersInfo) {
        const userCell = await User.findOne({ email: c.email }).cell;
        if (userCell == "none" || userCell == undefined) {
          userCommunication.push(c.email);
        } else {
          userCommunication.push(userCell);
        }
      }
    } catch (err) {
      console.error("Error getting communication for carpool: " + err);
      res.status(500).send("Error getting communication for carpool");
      return;
    }

    res.json(userCommunication);
  },
);

// Route to update the route for a specific carpool
router.patch(
  "/carpools/updateRoute/:id",
  getToken,
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);
    const { route, wlocation, carpoolers } = req.body;
    if (!route || !wlocation || !carpoolers || !id) {
      res.status(400).send("Bad Request");
      return;
    }

    try {
      await Carpool.findByIdAndUpdate(
        objectId,
        { route, wlocation, carpoolers },
        { new: true },
      );
    } catch (err) {
      console.error("Error updating carpool: " + err);
      res.status(500).send("Error updating carpool");
      return;
    }

    res.status(200).send("Carpool updated");
  },
);

// Route to delete a specific carpool
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

// Route for deleting a carpooler from a carpool
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

// Route to update a specific carpool
router.patch("/carpools/:id", getToken, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
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
});

// Route to update user information
router.patch("/users/update", async (req, res) => {
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
});

// Route to create a new carpool
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

// Route to get all users
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
