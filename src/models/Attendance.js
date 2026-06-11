const mongoose = require("mongoose");

// ======================================================
// BREAK SCHEMA
// ======================================================

const breakSchema = new mongoose.Schema(
  {
    breakIn: {
      type: Date,
      default: null,
    },

    breakOut: {
      type: Date,
      default: null,
    },

    minutes: {
      type: Number,
      default: 0,
    },

    source: {
      type: String,
      enum: ["manual", "employee_login", "google_login", "biometric"],
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

const attendanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    // Stores actual date object
    // Example in IST: 2026-05-22 00:00
    // MongoDB may show this as 2026-05-21T18:30:00.000Z
    date: {
      type: Date,
      required: true,
    },

    // Stores clean date string
    // Example: 2026-05-22
    // Use this for daily attendance checking
    attendanceDate: {
      type: String,
      required: true,
      index: true,
    },

    // ==================================================
    // PUNCH IN / OUT
    // ==================================================

    punchIn: {
      type: Date,
      default: null,
    },

    punchOut: {
      type: Date,
      default: null,
    },

    punchInSource: {
      type: String,
      enum: ["employee_login", "google_login", "biometric", "manual"],
      default: "employee_login",
    },

    punchOutSource: {
      type: String,
      enum: ["employee_login", "google_login", "biometric", "manual"],
      default: "employee_login",
    },

    // ==================================================
    // BREAKS
    // ==================================================

    breaks: {
      type: [breakSchema],
      default: [],
    },

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
     enum: ["present", "absent", "half_day", "leave", "late"],
      default: "present",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// UNIQUE INDEX
// One employee can have only one attendance per day
// ======================================================

attendanceSchema.index(
  {
    companyId: 1,
    employeeId: 1,
    attendanceDate: 1,
  },
  {
    unique: true,
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports = mongoose.model("Attendance", attendanceSchema);