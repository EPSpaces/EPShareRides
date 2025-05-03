// Create a new router to handle all the API routes
const express = require("express");
const fs = require("fs");
const rateLimit = require('express-rate-limit');

// Mongoose
const mongoose = require("mongoose");

const RATE_LIMITER_TIME_PERIOD = 15 * 60 * 1000
const RATE_LIMITER_REQUESTS = 100;

const User = require("../schemas/User.model.js");
const Event = require("../schemas/Event.model.js");
// ObjectId is a class that is used to convert a string into a MongoDB ObjectId
const ObjectId = require("mongodb").ObjectId;

// Carpool model
const Carpool = require("../schemas/Carpool.model.js");

// Create a new router to handle all the API routes
const router = express.Router();

const { authenticateToken } = require("../utils/authUtils");

// Function to write data to a JSON file
function writeToJSON(filepath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  // Write the data to the JSON file
  fs.writeFile(filepath, jsonString, (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
    }
  });
}

// Home route - Render home page with user information
// Simple rate limiter to prevent abuse
const homeLimiter = rateLimit({
  windowMs: RATE_LIMITER_TIME_PERIOD, // RATE_LIMITER_TIME_PERIOD in milliseconds
  max: RATE_LIMITER_REQUESTS // limit each IP to RATE_LIMITER_REQUESTS requests per windowMs
});


// Route to get points data
router.get("/points", homeLimiter, authenticateToken, (req, res) => {
  // Read the points data from the DB
  let points = require("../database/points.json");
  // Send the points data as a JSON response
  res.json(points);
});

// Route to handle updating user settings
router.patch("/updateSettings", homeLimiter, authenticateToken, async (req, res) => {
  // Get the settingId and newStatus from the request body
  const { settingId, newStatus } = req.body;
  // Check if the settingId and newStatus are not empty
  if (!settingId || !newStatus) {
    res.redirect("/updateSettings?err=Please fill in all fields");
    return;
  }

  try {
    // Update the user settings in the database
    await UserSettings.findOneAndUpdate(
      { userEmail: req.email },
      { $set: { [settingId]: newStatus } },
      { new: true },
    );
  } catch (err) {
    console.error("Error updating settings: " + err);
    res.redirect("/updateSettings?err=Error updating settings, please try again");
    return;
  }
  // Redirect to the update settings page with a success message
  res.redirect("/updateSettings?suc=Settings updated successfully");
});

// Route to get offer to carpool data
// Why do we have a req here?
router.get("/offerToCarpool", homeLimiter, authenticateToken, (req, res) => {
  // Read the offer to carpool data from the DB
  let offerToCarpool = require("../database/offerToCarpool.json");
  // Send the offer to carpool data as a JSON response
  res.json(offerToCarpool);
});

// Route to join a carpool
router.post("/joinCarpool", homeLimiter, authenticateToken, async (req, res) => {
  const { carpool: carpoolId, address } = req.body;
  const { email } = req;

  // Validate required fields
  if (!carpoolId || !address) {
    return res.status(400).send("Invalid request");
  }

  try {
    // Get user data
    const user = await User.findOne({ email });
    if (!user) {
      // Clear the id token
      res.clearCookie("idToken");
      return res.status(401).send("User not found");
    }

    // Find and update carpool in one operation
    const updatedCarpool = await Carpool.findOneAndUpdate(
      {
        _id: carpoolId,
        "carpoolers.email": { $ne: email }, // Check user not already in carpool
        $expr: { $lt: [{ $size: "$carpoolers" }, "$seats"] } // Check carpool not full
      },
      {
        // Add user to carpool
        $push: {
          carpoolers: {
            email,
            firstName: user.firstName,
            lastName: user.lastName,
            address
          }
        }
      },
      { new: true }
    );

    // Check if carpool was not updated
    if (!updatedCarpool) {
      const carpool = await Carpool.findById(carpoolId);
      // Check if carpool exists
      if (!carpool) {
        // Mission Failed Successfully
        return res.status(404).send("Carpool not found");
      }
      if (carpool.carpoolers.length >= carpool.seats) {
        // Carpool is full :(
        return res.status(400).send("Carpool is full");
      }
      // Mission failed, we'll get 'em next time
      return res.status(409).send("You are already in this carpool");
    }

    // Return updated carpool
    return res.status(200).json(updatedCarpool);

    // Catch any errors
  } catch (error) {
    console.error("Error joining carpool:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// Route to get all events
router.get("/events", homeLimiter, authenticateToken, async (req, res) => {
  // Get all the events from the DB
  let events;
  try {
    // Get all the events from the DB and wait for the response
    events = await Event.find({});
  } catch (err) {
    // Log the error
    console.error("Error getting events: " + err);
    // Send a 500 status code and an error message
    res.status(500).send("Error getting events");
    return;
  }
  // Send the events as a JSON response
  res.json(events);
});

// Route to create a new event
router.post("/events", homeLimiter, authenticateToken, async (req, res) => {
  // Get the event data from the request body
  // Create a new event object with the event data
  const { eventName, wlocation, date, category, addressToPut } = req.body;
  //Create the user object
  let userInData;
  // Get the user's email from the request
  const email = req.email;
  // Try to find the user in the DB
  try {
    // Find the user in the DB and wait for the response
    userInData = await User.findOne({ email });
    // If the user is not found, clear the auth token and redirect to the sign in page because they are not signed in with the right credentials
    if (!userInData) {
      // Clear the id token
      res.clearCookie("idToken");
      res.redirect(
        "/signin?err=Error with verifing privileges, please try again",
      );
      return;
    }
    // If there is an error, clear the auth token and redirect to the sign in page because there was an internal server error
  } catch (err) {
    // Log the error
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }
  // Get the user's first name and last name from the user data
  const { firstName, lastName, admin } = userInData;
  // Check if the user is an admin because only admins can create events
  if (!admin) {
    // Send a 401 status code because the user is not an admin
    res.sendStatus(401);
    return;
  }
  // Check if the event data is valid
  try {
    // Check if the event name, location, date, and category are valid
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

    // Save the new event to the DB
    await newEvent.save();
  } catch (err) {
    // Log the error
    console.error("Error saving event: " + err);
    res.status(500).send("Error saving event");
    return;
  }
  // Send a 200 status code because the event was saved successfully
  res.status(200).send("Event saved");
  return;
});

// Route to get all carpools
// Why do we have a req here?
router.get("/carpools", homeLimiter, authenticateToken, async (req, res) => {
  // Get all the carpools from the DB
  try {
    // Get all the carpools from the DB and wait for the response
    const carpools = await Carpool.find({});
    // Send the carpools as a JSON response
    res.json(carpools);
    // If there is an error, send a 500 status code and an error message
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
  }
});

// Route to get user's carpools
router.get("/userCarpools", homeLimiter, authenticateToken, async (req, res) => {
  // Let carpools be an empty array to store the carpools
  let carpools = [];
  // Try to get the carpools from the DB
  try {
    // Get all the carpools created by the user
    const carpoolsCreated = await Carpool.find({ email: req.email }).exec();
    // Get all the carpools joined by the user
    const carpoolsJoined = await Carpool.find({
      "carpoolers.email": req.email,
    }).exec();
    // Combine the carpools created and joined by the user
    carpools = [...carpoolsCreated, ...carpoolsJoined];
    // Something went wrong that should not have gone wrong
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
    return;
  }
  // Send the carpools as a JSON response
  res.json(carpools);
});

// Route to get the route for a specific carpool
router.get("/mapRoute/:id", homeLimiter, authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Check if the carpool ID is valid
  if (!id) {
    res.status(400).send("Bad Request");
    return;
  }

  // Let carpool be an empty object to store the carpool
  let carpool;

  // Try to get the carpool from the DB
  try {
    // Get the carpool from the DB and wait for the response
    carpool = await Carpool.findById(id);
  } catch (err) {
    console.error("Error retrieving carpool: " + err);
    res.status(500).send("Error retrieving carpool");
    return;
  }

  let final;

  // Try to get the event from the DB
  try {
    // Get the event from the DB and wait for the response
    final = await Event.findById(
      new mongoose.Types.ObjectId(carpool.nameOfEvent),
    );
    // Get the address of the event
    final = final.address;
  } catch (err) {
    console.error("Error retrieving event: " + err);
    res.status(500).send("Error retrieving event");
    return;
  }

  // If the carpool route is a point, send the point as the only stop
  if (carpool.route == "point") {
    // Send the point as the only stop
    res.json({
      final,
      stops: [carpool.wlocation],
    });
  } else {
    // If the carpool route is a route, send the route as the stops
    let addresses = [];
    // Get the addresses of the carpoolers
    carpool.carpoolers.forEach((carpooler) => {
      addresses.push(carpooler.address);
    });
    // Send the route as the stops
    res.json({
      final,
      stops: addresses,
    });
  }
});

// Route to get communication details for the users in a carpool
router.get(
  // Get the carpool ID from the request
  "/carpoolUserCommunication/:id",
  homeLimiter,
   
  authenticateToken,
  async (req, res) => {
    // Get the carpool ID from the request
    const { id } = req.params;

    // Check if the carpool ID is valid
    if (!id) {
      res.status(400).send("Bad Request");
      return;
    }

    // Let carpoolId be an empty object to store the carpool ID
    let carpoolId;
    // Try to get the carpool ID
    try {
      carpoolId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      res.status(400).send("Bad Request");
      return;
    }

    // Let userCommunication be an empty array to store the user communication details
    let userCommunication = [];

    // Try to get the communication details for the users in the carpool
    try {
      // Get the email of the carpool owner
      const carpoolOwnerEmailE = await Carpool.findById(carpoolId);
      const carpoolOwnerEmail = carpoolOwnerEmailE.email;

      // Get the cell number of the carpool owner
      const carpoolOwnerCell = await User.findOne({ email: carpoolOwnerEmail })
        .cell;
      // If the carpool owner does not have a cell number, use their email
      if (carpoolOwnerCell == undefined || carpoolOwnerCell == "none") {
        userCommunication.push(carpoolOwnerEmail);
        // If the carpool owner has a cell number, use their cell number
      } else {
        userCommunication.push(carpoolOwnerCell);
      }

      // Get the email and cell number of the carpoolers
      const carpoolersInfoO = await Carpool.findById(carpoolId).exec();

      // Get the carpoolers information
      const carpoolersInfo = carpoolersInfoO.carpoolers;

      // Get the email and cell number of the carpoolers
      for (const c of carpoolersInfo) {
        // Get the cell number of the carpooler
        const userCell = await User.findOne({ email: c.email }).cell;
        // If the carpooler does not have a cell number, use their email
        if (userCell == "none" || userCell == undefined) {
          userCommunication.push(c.email);
        } else {
          // If the carpooler has a cell number, use their cell number
          userCommunication.push(userCell);
        }
      }
    } catch (err) {
      console.error("Error getting communication for carpool: " + err);
      res.status(500).send("Error getting communication for carpool");
      return;
    }
    // Send the user communication details as a JSON response
    res.json(userCommunication);
  },
);

// Route to update the route for a specific carpool
router.patch(
  "/carpools/updateRoute/:id",
  homeLimiter,
   
  authenticateToken,
  async (req, res) => {
    // Get the carpool ID from the request
    const { id } = req.params;
    const objectId = new mongoose.Types.ObjectId(id);
    // Set the route, location, and carpoolers for the carpool
    const { route, wlocation, carpoolers } = req.body;
    // Check if the route, location, and carpoolers are valid
    if (!route || !wlocation || !carpoolers || !id) {
      res.status(400).send("Bad Request");
      return;
    }

    // Try to update the carpool
    try {
      // Update the carpool and wait for the response
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

    // Send a 200 status code because the carpool was updated successfully
    res.status(200).send("Carpool updated");
  },
);

// Route to delete a specific carpool
router.delete(
  "/carpools/:id",
  homeLimiter,
   
  authenticateToken,
  async (req, res) => {
    try {
      // Get the carpool ID from the request
      const { id } = req.params;
      // Delete the carpool from the DB
      const carpools = await Carpool.deleteOne({
        _id: new ObjectId(id),
      });
      // Send a 200 status code because the carpool was deleted successfully
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
  homeLimiter,
   
  authenticateToken,
  async (req, res) => {
    // Get the carpool ID from the request
    try {
      const { _id, _id2 } = req.body;
      // Update the carpool to remove the carpooler
      const carpools = await Carpool.updateOne(
        // Find the carpool by ID
        { _id: new ObjectId(_id2) },
        // Remove the carpooler from the carpool
        { $pull: { carpoolers: { _id: new ObjectId(_id) } } },
      );
      // Send the updated carpool as a JSON response
      res.json(carpools);
    } catch (err) {
      console.error("Error updating carpools: " + err);
      res.status(500).send("Error updating carpools");
    }
  },
);

// Route to update a specific carpool
router.patch("/carpools/:id", homeLimiter, authenticateToken, async (req, res) => {
  try {
    // Get the carpool ID from the request
    const { id } = req.params;
    // Get the updated carpool data from the request
    const { route, wlocation } = req.body;
    // Update the carpool with the new data
    const carpools = await Carpool.updateOne(
      { _id: new ObjectId(id) },
      { $set: { route: route } },
      { $set: { wlocation: wlocation } },
    );
    // Send the updated carpool as a JSON response
    res.json(carpools);
  } catch (err) {
    console.error("Error updating carpools: " + err);
    res.status(500).send("Error updating carpools");
  }
});

// Route to update user information
router.patch("/users/update", homeLimiter, async (req, res) => {
  try {
    // Get the user ID from the request
    const { _id, address, privacy } = req.body;
    // Update the user with the new data
    const users = await User.updateOne(
      // Find the user by ID
      { _id: new ObjectId(_id) },
      // Update the user's address and privacy settings
      { $set: { address: address, privacy: privacy } },
    );

    // Send the updated user as a JSON response
    res.json(users);
  } catch (err) {
    console.error("Error updating user: " + err);
    res.status(500).send("Error updating user");
  }
});

// Route to create a new carpool
router.post("/carpools", homeLimiter, authenticateToken, async (req, res) => {
  // Create a person object with the data
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

  // Check if the data is valid
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

  // Create a new carpool object with the data
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

  // Try to save the new carpool
  try {
    await newCarpool.save();
  } catch (err) {
    console.error("Error creating new carpool: " + err);
    res.status(500).send("Error creating new carpool");
    return;
  }
  // Send a 200 status code because the carpool was created successfully
  res.status(200).send("Carpool created");
});

// Route to get all users
// Why do we have a req here?
router.get("/users", homeLimiter, authenticateToken, async (req, res) => {
  // Get all the users from the DB
  let users;
  // Try to get the users from the DB
  try {
    // Get all the users from the DB and wait for the response
    users = await User.find({});
  } catch (err) {
    // Log the error
    console.error("Error getting users: " + err);
    res.status(500).send("Error getting users");
    return;
  }
  // Send the users as a JSON response
  res.json(users);
});

// Route to get a specific user
module.exports = router;