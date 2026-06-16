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

    attendanceDate: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    punchIn: {
      type: Date,
      default: null,
    },

    punchOut: {
      type: Date,
      default: null,
    },

    breaks: [breakSchema],

    totalBreakMinutes: {
      type: Number,
      default: 60,
    },

    workingMinutes: {
      type: Number,
      default: 0,
    },

    session: {
      type: String,
      enum: [
        "full_day",
        "first_half",
        "second_half",
        "absent",
      ],
      default: "absent",
    },

    status: {
      type: String,
      enum: [
        "present",
        "half_day",
        "absent",
        "leave",
      ],
      default: "absent",
    },

    attendanceMode: {
      type: String,
      enum: [
        "employee_login",
        "biometric",
        "google_signin",
      ],
      default: "employee_login",
    },
  },
  { timestamps: true }
);

attendanceSchema.index(
  {
    companyId: 1,
    employeeId: 1,
    attendanceDate: 1,
  },
  { unique: true }
);

module.exports = mongoose.model(
  "Attendance",
  attendanceSchema
);