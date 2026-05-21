const mongoose = require("mongoose");

const breakSchema = new mongoose.Schema(
  {
    breakIn: Date,
    breakOut: Date,

    minutes: {
      type: Number,
      default: 0,
    },

    source: {
      type: String,
      enum: ["manual", "biometric", "system_lock"],
      default: "manual",
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    punchIn: Date,
    punchOut: Date,

    punchInSource: {
      type: String,
      enum: ["employee_login", "google_login", "biometric"],
      default: "employee_login",
    },

    punchOutSource: {
      type: String,
      enum: ["employee_login", "google_login", "biometric"],
      default: "employee_login",
    },

    breaks: [breakSchema],

    totalBreakMinutes: {
      type: Number,
      default: 0,
    },

    workingMinutes: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["present", "half_day", "absent"],
      default: "present",
    },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { companyId: 1, employeeId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);