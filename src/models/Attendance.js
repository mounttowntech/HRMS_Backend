const mongoose = require("mongoose");
const deviceInfoSchema = require("./deviceInfo");

const breakSchema = new mongoose.Schema(
  {
    breakIn: Date,
    breakOut: Date,
    breakInDevice: deviceInfoSchema,
    breakOutDevice: deviceInfoSchema,

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

    shiftName: {
      type: String,
      enum: ["General Shift", "Night Shift"],
      default: "General Shift",
    },

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
      default: "",
    },

    punchOutSource: {
      type: String,
      default: "",
    },

    breaks: [breakSchema],

    totalBreakMinutes: {
      type: Number,
      default: 60,
    },

    extraBreakMinutes: {
      type: Number,
      default: 0,
    },

    workingMinutes: {
      type: Number,
      default: 0,
    },

    lateMinutes: {
      type: Number,
      default: 0,
    },

    isLate: {
      type: Boolean,
      default: false,
    },

    session: {
      type: String,
      enum: ["full_day", "half_day", "first_half", "second_half", "absent"],
      default: "absent",
    },

    status: {
      type: String,
      enum: ["present", "half_day", "absent", "leave"],
      default: "absent",
    },

    attendanceMode: {
      type: String,
      enum: ["employee_login", "biometric", "google_login", "regularization"],
      default: "employee_login",
    },

    permissionMinutes: {
      type: Number,
      default: 0,
    },

    permissionApproved: {
      type: Boolean,
      default: false,
    },

    punchInDevice: deviceInfoSchema,
    punchOutDevice: deviceInfoSchema,
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

module.exports = mongoose.model("Attendance", attendanceSchema);