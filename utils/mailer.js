const nodemailer = require("nodemailer");

// configure SMTP transport using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  requireTLS: true, // Always use TLS
  tls: {
    minVersion: 'TLSv1.2', // Enforce minimum TLS version
    rejectUnauthorized: true // Verify certificate
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take our messages");
  }
});

module.exports = transporter;