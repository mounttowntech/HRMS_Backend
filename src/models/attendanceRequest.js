const mongoose = require("mongoose");

const attendanceRequestSchema = new mongoose.Schema(
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

    requestType: {
      type: String,
      enum: [
        "forgot_checkin",
        "forgot_checkout",
        "missed_attendance",
        "forgot_break_start",
        "forgot_break_end",
        "break_correction",
      ],
      required: true,
    },

    attendanceDate: {
      type: String,
      required: true,
    },

    requestedPunchIn: {
      type: Date,
      default: null,
    },

    requestedPunchOut: {
      type: Date,
      default: null,
    },

    breakIn: {
      type: Date,
      default: null,
    },

    breakOut: {
      type: Date,
      default: null,
    },

    breakMinutes: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceRequest", attendanceRequestSchema);