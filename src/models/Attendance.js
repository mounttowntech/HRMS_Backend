const mongoose = require("mongoose");

// ======================================================
// BREAK SCHEMA
// ======================================================

const breakSchema =
  new mongoose.Schema(
    {
      breakIn: {
        type: Date,
      },

      breakOut: {
        type: Date,
      },

      minutes: {
        type: Number,
        default: 0,
      },

      source: {
        type: String,
        enum: [
          "manual",
          "employee_login",
          "google_login",
          "biometric",
        ],

        default: "manual",
      },
    },
    {
      _id: false,
    }
  );

// ======================================================
// ATTENDANCE SCHEMA
// ======================================================

const attendanceSchema =
  new mongoose.Schema(
    {
      companyId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Company",

        required: true,
      },

      employeeId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Employee",

        required: true,
      },

      date: {
        type: Date,

        required: true,
      },

      // ==================================================
      // PUNCH IN / OUT
      // ==================================================

      punchIn: {
        type: Date,
      },

      punchOut: {
        type: Date,
      },

      punchInSource: {
        type: String,

        enum: [
          "employee_login",
          "google_login",
          "biometric",
          "manual",
        ],
      },

      punchOutSource: {
        type: String,

        enum: [
          "employee_login",
          "google_login",
          "biometric",
          "manual",
        ],
      },

      // ==================================================
      // BREAKS
      // ==================================================

      breaks: [breakSchema],

      totalBreakMinutes: {
        type: Number,
        default: 0,
      },

      workingMinutes: {
        type: Number,
        default: 0,
      },

      // ==================================================
      // STATUS
      // ==================================================

      status: {
        type: String,

        enum: [
          "present",
          "absent",
          "half_day",
          "leave",
        ],

        default: "present",
      },
    },
    {
      timestamps: true,
    }
  );

// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model(
  "Attendance",
  attendanceSchema
);