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
  const { email, transporter } = req; // Added transporter

  if (!carpoolId || !address) {
    return res.status(400).send("Invalid request");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.clearCookie("idToken");
      return res.status(401).send("User not found");
    }

    const carpool = await Carpool.findById(carpoolId);
    if (!carpool) return res.status(404).send("Carpool not found");
    if (carpool.carpoolers.some(c => c.email === email)) {
      return res.status(409).send("You are already in this carpool");
    }
    if (carpool.pendingRequests.some(c => c.email === email)) {
      return res.status(409).send("You have already requested to join");
    }
    if (carpool.carpoolers.length >= carpool.seats) {
      return res.status(400).send("Carpool is full");
    }
    carpool.pendingRequests.push({
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      address
    });
    await carpool.save();

    // Send email to carpool owner
    const event = await Event.findById(carpool.nameOfEvent);
    const mailOptionsToOwner = {
      from: process.env.SMTP_USER,
      to: carpool.email, // Email of the carpool owner
      subject: `New Join Request for Your Carpool: ${event ? event.eventName : 'Unknown Event'}`,
      text: `${user.firstName} ${user.lastName} (${user.email}) has requested to join your carpool for the event: ${event ? event.eventName : 'Unknown Event'}.\n\nPlease log in to the app to approve or deny this request.`
    };
    try {
      await transporter.sendMail(mailOptionsToOwner);
    } catch (e) {
      console.error('Failed to send join request email to owner:', e);
    }

    return res.status(200).json({ message: "Request sent for approval" });
  } catch (error) {
    console.error("Error joining carpool:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// Approve or deny a pending carpool request (owner only)
router.post("/carpools/:id/approve", homeLimiter, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email: requesterEmail, approve } = req.body; // approve: true/false
    const { transporter } = req; // Added transporter
    
    const carpool = await Carpool.findById(id);
    if (!carpool) return res.status(404).send("Carpool not found");
    
    if (carpool.userEmail !== req.email) {
      console.log("Auth failed: carpool.userEmail=", carpool.userEmail, "req.email=", req.email);
      return res.status(403).send("Not authorized");
    }
    
    const idx = carpool.pendingRequests.findIndex(c => c.email === requesterEmail);
    if (idx === -1) return res.status(404).send("Request not found");
    
    const request = carpool.pendingRequests[idx];
    const event = await Event.findById(carpool.nameOfEvent);

    if (approve) {
      if (carpool.carpoolers.length >= carpool.seats) {
        return res.status(400).send("Carpool is full");
      }
      carpool.carpoolers.push(request);
    }
    
    carpool.pendingRequests.splice(idx, 1);
    await carpool.save();
    
    // Send email to requester about approval/denial
    const mailOptionsToRequester = {
      from: process.env.SMTP_USER,
      to: requesterEmail,
      subject: `Carpool Request Update for ${event ? event.eventName : 'Unknown Event'}`,
      text: `Your request to join the carpool for the event: ${event ? event.eventName : 'Unknown Event'} (Driver: ${carpool.firstName} ${carpool.lastName}) has been ${approve ? 'approved' : 'denied'}.`
    };
    try {
      await transporter.sendMail(mailOptionsToRequester);
    } catch (e) {
      console.error('Failed to send approval/denial email to requester:', e);
    }
    
    return res.status(200).json({ message: approve ? "Approved" : "Denied" });
  } catch (err) {
    console.error("Error approving/denying carpool request:", err);
    return res.status(500).send("Error processing request");
  }
});

// Route to get all events (future only)
router.get("/events", homeLimiter, authenticateToken, async (req, res) => {
  let events;
  try {
    const now = new Date();
    // Only return events with date after now
    events = await Event.find({ date: { $gt: now.toISOString() } });
  } catch (err) {
    console.error("Error getting events: " + err);
    res.status(500).send("Error getting events");
    return;
  }
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
router.get("/carpools", homeLimiter, authenticateToken, async (req, res) => {
  try {
    // Only return carpools with arrivalTime after now
    const carpools = await Carpool.find();
    // Format arrivalTime to 12-hour AM/PM if present
    const formattedCarpools = carpools.map(carpool => {
      let formatted = carpool.toObject();
      if (formatted.arrivalTime && typeof formatted.arrivalTime === "string" && formatted.arrivalTime.match(/^\d{2}:\d{2}$/)) {
        // Convert "HH:mm" to 12-hour format
        const [hour, minute] = formatted.arrivalTime.split(":");
        const date = new Date();
        date.setHours(Number(hour), Number(minute));
        formatted.arrivalTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return formatted;
    });
    res.json(formattedCarpools);
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
  }
});

// Route to get user's carpools
router.get("/userCarpools", homeLimiter, authenticateToken, async (req, res) => {
  let carpools = [];
  try {
    const carpoolsCreated = await Carpool.find({ userEmail: req.userEmail }).exec();
    const carpoolsJoined = await Carpool.find({ "carpoolers.userEmail": req.userEmail }).exec();
    carpools = [...carpoolsCreated, ...carpoolsJoined];
  } catch (err) {
    console.error("Error retrieving carpools: " + err);
    res.status(500).send("Error retrieving carpools");
    return;
  }
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
  } else if (carpool.route == "eps-campus") {
    // EPS campus as the only stop
    res.json({
      final: "10613 NE 38th Place, Kirkland, WA 98033",
      stops: ["10613 NE 38th Place, Kirkland, WA 98033"],
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
    const { route, wlocation, carpoolers, email, phone, carMake, seats, arrivalTime } = req.body;
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
        { 
          route, 
          wlocation, 
          carpoolers,
          email,
          phone,
          carMake,
          seats,
          arrivalTime
        },
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
      
      console.log("Removing carpooler with ID:", _id, "from carpool with ID:", _id2);
      
      // Update the carpool to remove the carpooler
      const carpools = await Carpool.updateOne(
        // Find the carpool by ID
        { _id: new ObjectId(_id2) },
        // Remove the carpooler from the carpool
        { $pull: { carpoolers: { _id: new ObjectId(_id) } } },
      );
      
      // Check if the update was successful
      if (carpools.modifiedCount === 0) {
        console.error("Failed to remove carpooler, no document matched or no changes made");
        return res.status(404).send("Failed to remove carpooler");
      }
      
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
    const { _id, address, privacy, cell } = req.body;
    // Update the user with the new data
    const users = await User.updateOne(
      // Find the user by ID
      { _id: new ObjectId(_id) },
      // Update the user's address, privacy settings, and phone number
      { $set: { address: address, privacy: privacy, cell: cell } },
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
  const { 
    firstName, 
    lastName, 
    email,
    phone,
    carMake,
    seats, 
    route, 
    wlocation, 
    carpoolers, 
    nameOfEvent,
    userEmail,
    arrivalTime 
  } = req.body;

  try {
    const newCarpool = new Carpool({
      firstName,
      lastName,
      email,
      phone,
      carMake,
      seats,
      route,
      wlocation,
      carpoolers,
      nameOfEvent,
      userEmail,
      arrivalTime
    });

    await newCarpool.save();
    res.status(200).json(newCarpool);
  } catch (err) {
    console.error("Error creating carpool:", err);
    res.status(500).send("Error creating carpool");
  }
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

// Route to get contact information for a carpool group
router.get("/carpools/:id/contact-info", homeLimiter, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carpool = await Carpool.findById(id);
    
    if (!carpool) {
      return res.status(404).send("Carpool not found");
    }

    // Get all emails and phone numbers
    const emails = [carpool.userEmail]; // Driver's email
    const phones = carpool.phone ? [carpool.phone] : []; // Driver's phone

    // Add carpoolers' contact info
    for (const carpooler of carpool.carpoolers) { // changed: used carpool.carpoolers instead of undefined carpoolers
      const user = await User.findOne({ email: carpooler.email });
      if (user) {
        emails.push(user.email);
        if (user.cell && user.cell !== "none") {
          phones.push(user.cell);
        }
      }
    }

    res.json({ emails, phones });
  } catch (err) {
    console.error("Error getting contact info:", err);
    res.status(500).send("Error getting contact information");
  }
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