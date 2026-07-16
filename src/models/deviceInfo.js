const mongoose = require("mongoose");

const deviceInfoSchema = new mongoose.Schema(
  {
    // User Details
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    userName: String,
    employeeName: String,
    role: String,

    // Device Details
    deviceType: {
      type: String, // Desktop | Mobile | Tablet
    },
    os: String, // Windows 11, Android 15, iOS 18
    browser: String, // Chrome, Edge, Firefox
    browserVersion: String,
    platform: String,
    appVersion: String,

    // Network
    ipAddress: String,
    macAddress: String, // Usually not available from browsers
    userAgent: String,

    // Optional
    screenResolution: String,
    timezone: String,
    language: String,

    // Login Source
    source: {
      type: String,
      enum: [
        "employee_login",
        "admin",
        "hr",
        "projectmanager",
        "teamlead",
        "biometric",
        "mobile_app",
      ],
      default: "employee_login",
    },

    loginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

module.exports = deviceInfoSchema;