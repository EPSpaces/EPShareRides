// Import libraries
const fs = require("fs");
const express = require("express");
const ejs = require("ejs");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const cron = require('node-cron');
const nodemailer = require('nodemailer');

// Load environment variables from env.local or .env file
const envPath = fs.existsSync('./env.local') ? './env.local' : './.env';
console.log(`Loading environment variables from: ${envPath}`);

// Log the content of the env file
if (fs.existsSync(envPath)) {
  console.log('Environment file content:');
  console.log(fs.readFileSync(envPath, 'utf-8'));
} else {
  console.log('Environment file not found at:', envPath);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Log all environment variables (be careful with sensitive data in production)
console.log('Loaded environment variables:');
console.log({
  NODE_ENV: process.env.NODE_ENV,
  MODE: process.env.MODE,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? 'MONGO_URI is set' : 'MONGO_URI is NOT set',
  MONGO_URI_LENGTH: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0
});

// Import Schemas from MongoDB
const User = require("./schemas/User.model.js");
const Event = require("./schemas/Event.model.js");
const Carpool = require("./schemas/Carpool.model.js");
const UserSettings = require("./schemas/UserSettings.model.js");

// Initialize Firebase app
const firebaseadmin = require('firebase-admin');
var serviceAccount = require("./service_account.json");
process.env.GOOGLE_APPLICATION_CREDENTIALS = "./service_account.json";

firebaseadmin.initializeApp({
  credential: firebaseadmin.credential.cert(serviceAccount)
});

// Import Util Functions
const {
  authenticateToken,
} = require("./utils/authUtils");

// Import Student Utilities
const { loadStudentData, findNearbyStudents } = require('./utils/studentUtils');

// Initialize Express server
const app = express();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");

// Import Rate Limiter
const rateLimit = require('express-rate-limit');

app.set("view engine", "ejs"); // Set view engine to EJS
app.use(express.json()); // Parse JSON requests
app.use(express.static(__dirname + "/public")); // Serve static files
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: "100mb" })); // Set JSON body limit to 100mb
app.use(express.urlencoded({ extended: true, limit: "100mb" })); // Parse URL-encoded bodies with limit

// Pass transporter to apiRoutes
app.use('/api/', (req, res, next) => {
  req.transporter = transporter;
  next();
}, apiRoutes);

app.use('/', authRoutes);

// Home route - Render home page with user information
// Simple rate limiter to prevent abuse
const homeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.get("/", homeLimiter, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email }); // Find user by email
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];
  admin = userInData["admin"];

  res.render("index", { email, firstName, lastName, admin }); // Render home page
});

// Sustainability statement route
app.get("/sustainabilityStatement", (req, res) => {
  res.render("sustainabilityStatement"); // Render sustainability statement page
});

// My carpools route - Render user's carpools
app.get("/mycarpools", homeLimiter, authenticateToken, async (req, res) => {
  const email = req.email;
  console.log(`[${new Date().toISOString()}] /mycarpools route called for user: ${email}`);
  
  try {
    // Get user data
    const userInData = await User.findOne({ email });
    if (!userInData) {
      console.error(`User not found: ${email}`);
      res.clearCookie("idToken");
      return res.redirect("/signin?err=User not found, please sign in again");
    }
    
    console.log(`Found user: ${userInData.firstName} ${userInData.lastName}`);
    
    // Get user's carpools
    let offeredCarpools = [];
    let joinedCarpools = [];
    
    try {
      [offeredCarpools, joinedCarpools] = await Promise.all([
        // Get carpools where user is the driver
        Carpool.find({ userEmail: email })
          .populate('nameOfEvent', 'eventName date')
          .lean(),
        
        // Get carpools where user is a passenger but not the driver
        Carpool.find({ 
          'carpoolers.email': email,
          userEmail: { $ne: email } // Exclude carpools where user is the driver
        })
        .populate('nameOfEvent', 'eventName date')
        .lean()
      ]);
      
      console.log(`Found ${offeredCarpools.length} offered carpools and ${joinedCarpools.length} joined carpools`);
    } catch (dbError) {
      console.error('Error fetching carpools:', dbError);
      // Continue with empty arrays if there's an error
    }
    
    // Format the data for the template
    const formatCarpool = (carpool) => {
      try {
        // Format carpoolers data
        const formattedCarpoolers = (carpool.carpoolers || []).map(carpooler => {
          // Handle case where carpooler is a string (shouldn't happen with current schema)
          if (typeof carpooler === 'string') {
            return {
              email: carpooler,
              co2Savings: 0,
              firstName: '',
              lastName: ''
            };
          }
          
          // Handle case where carpooler is an object
          return {
            ...carpooler,
            email: carpooler.email || '',
            firstName: carpooler.firstName || '',
            lastName: carpooler.lastName || '',
            co2Savings: Number(carpooler.co2Savings) || 0,
            _id: carpooler._id?.toString() || new mongoose.Types.ObjectId().toString()
          };
        });
        
        // Format the carpool object
        const formattedCarpool = {
          ...carpool,
          _id: carpool._id?.toString() || new mongoose.Types.ObjectId().toString(),
          carpoolers: formattedCarpoolers,
          co2Savings: Number(carpool.co2Savings) || 0,
          userEmail: carpool.userEmail || email,
          firstName: carpool.firstName || '',
          lastName: carpool.lastName || '',
          seats: Number(carpool.seats) || 4,
          createdAt: carpool.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: carpool.updatedAt?.toISOString() || new Date().toISOString()
        };
        
        // Add event data if exists
        if (carpool.nameOfEvent) {
          formattedCarpool.nameOfEvent = {
            _id: carpool.nameOfEvent._id?.toString() || new mongoose.Types.ObjectId().toString(),
            eventName: carpool.nameOfEvent.eventName || 'Unknown Event',
            date: carpool.nameOfEvent.date?.toISOString() || new Date().toISOString()
          };
        }
        
        return formattedCarpool;
      } catch (formatError) {
        console.error('Error formatting carpool:', formatError);
        // Return a minimal valid carpool object
        return {
          _id: new mongoose.Types.ObjectId().toString(),
          carpoolers: [],
          co2Savings: 0,
          userEmail: email,
          firstName: '',
          lastName: '',
          seats: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nameOfEvent: {
            _id: new mongoose.Types.ObjectId().toString(),
            eventName: 'Unknown Event',
            date: new Date().toISOString()
          }
        };
      }
    };
    
    // Format all carpools
    const formattedOffered = (offeredCarpools || []).map(formatCarpool);
    const formattedJoined = (joinedCarpools || []).map(formatCarpool);
    
    // Log some debug info
    console.log(`Formatted ${formattedOffered.length} offered and ${formattedJoined.length} joined carpools`);
    
    // Render the template with the data
    res.render("mycarpools", {
      email,
      firstName: userInData.firstName || '',
      lastName: userInData.lastName || '',
      offeredCarpools: JSON.stringify(formattedOffered),
      joinedCarpools: JSON.stringify(formattedJoined),
      message: req.query.message,
      error: req.query.error,
    });
  } catch (err) {
    console.error("Error in myCarpools route:", err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
  }
});

// Update settings route - Allow user to update their settings
app.get("/updateSettings", homeLimiter, authenticateToken, async (req, res) => {
  const email = req.email;
  let firstName;
  let lastName;

  let userInData;

  try {
    userInData = await User.findOne({ email });;
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];

  res.render("updateSettings", { email, firstName, lastName }); // Render update settings page
});

// Find Rides route - Display available rides
app.get("/findrides", homeLimiter, authenticateToken, async (req, res) => {
  try {
    console.log('=== /findrides route called ===');
    const email = req.email;
    let firstName = '';
    let lastName = '';
    const message = req.query.message || '';
    const error = req.query.error || '';
    let results = null;
    const searchQuery = req.query.search || '';
    const searchRadius = req.query.radius || '5';

    console.log('Search parameters:', { searchQuery, searchRadius });

    // Try to get user data
    try {
      const userInData = await User.findOne({ email });
      if (!userInData) {
        console.error('User not found for email:', email);
        res.clearCookie("idToken");
        return res.redirect("/signin?err=Error with system finding User, please try again");
      }
      firstName = userInData.firstName || '';
      lastName = userInData.lastName || '';
      console.log('Authenticated user:', { firstName, lastName, email });
    } catch (err) {
      console.error("Error finding user:", err);
      res.clearCookie("idToken");
      return res.redirect("/signin?err=Internal server error, please sign in again");
    }

    // If there's a search query, process it
    if (searchQuery && searchRadius) {
      console.log('Processing search query...');
      try {
        console.log('Calling findNearbyStudents with:', { searchQuery, searchRadius });
        results = await findNearbyStudents(searchQuery, parseFloat(searchRadius));
        console.log('Search results:', results ? 'Found ' + (results.nearbyStudents ? results.nearbyStudents.length : 0) + ' nearby students' : 'No results');
      } catch (err) {
        console.error('Search error details:', {
          message: err.message,
          stack: err.stack,
          searchQuery,
          searchRadius
        });
        return res.redirect('/findrides?error=' + encodeURIComponent('Error processing your search: ' + (err.message || 'Unknown error')));
      }
    } else {
      console.log('No search query provided, showing empty form');
    }

    // Prepare the template data
    const templateData = { 
      email, 
      firstName, 
      lastName, 
      message,
      error,
      results,
      searchQuery,
      searchRadius
    };

    console.log('Rendering findrides template with data');
    res.render("findrides", templateData);
  } catch (error) {
    console.error('Unexpected error in /findrides route:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Friends route - Display list of all users
app.get("/friends", homeLimiter, authenticateToken, async (req, res) => {
  let people = [];
  let i = 0;
  let users;
  try {
    users = await User.find({}); // Find all users
  } catch (err) {
    res.clearCookie("idToken");
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
    userInData = await User.findOne({ email });;
    if (!userInData) {
      res.clearCookie("idToken");
      res.redirect("/signin?err=Error with system finding User, please try again");
      return;
    }
  } catch (err) {
    console.error("Error finding user: " + err);
    res.clearCookie("idToken");
    res.redirect("/signin?err=Internal server error, please sign in again");
    return;
  }

  firstName = userInData["firstName"];
  lastName = userInData["lastName"];

  res.render("friends", { people, email, firstName, lastName }); // Render friends page
});

// Setup 404 page - Handle undefined routes
app.use((req, res) => {
  res.status(404).render("404"); // Render 404 page
});

// Configure nodemailer (replace with your SMTP credentials)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Cron job: every 5 minutes, check for carpools 2 hours from now
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  // Find carpools where arrivalTime is within 5 minutes of two hours from now, and not already locked
  const carpools = await Carpool.find({
    arrivalTime: { $gte: twoHoursLater.toISOString(), $lt: new Date(twoHoursLater.getTime() + 5 * 60 * 1000).toISOString() },
    'pendingRequests.0': { $exists: true }
  });
  for (const carpool of carpools) {
    // Close signups: clear pendingRequests
    carpool.pendingRequests = [];
    await carpool.save();
    // Gather emails
    const emails = [carpool.email, ...carpool.carpoolers.map(c => c.email)];
    // Compose email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: emails.join(','),
      subject: 'Carpool Reminder: ' + (carpool.nameOfEvent || ''),
      text: `Reminder: Your carpool for event ${carpool.nameOfEvent || ''} is scheduled to arrive at ${carpool.arrivalTime}.

Driver: ${carpool.firstName} ${carpool.lastName}
Car: ${carpool.carMake}
Pickup: ${carpool.wlocation}
If you have questions, contact your driver at ${carpool.email} or ${carpool.phone}.
`
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.error('Failed to send carpool reminder email:', e);
    }
  }
});

const port = process.env["PORT"] || 8080;

console.log(process.env["MONGO_URI"]);

// Connect to the database and start the server
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/epcarpool?directConnection=true';
console.log('Attempting to connect to MongoDB with URI:', mongoUri);

// Load student data when the server starts
loadStudentData().then(() => {
  console.log('Student data loaded successfully');
}).catch(err => {
  console.error('Failed to load student data:', err);
});
console.log('Current environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  MODE: process.env.MODE,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? 'SET' : 'NOT SET'
});

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB");
    console.log("MongoDB connection state:", mongoose.connection.readyState);

    app.listen(process.env.PORT, () => {
      console.log(`Server started on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to db:", err);
    return;
  });