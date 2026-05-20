const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    employeeCode: {
      type: String,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: String,

    designation: String,

    department: String,

    salary: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["employee", "hr", "admin", "teamlead", "projectmanager"],
      default: "employee",
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "onboarding", "active", "inactive", "terminated"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema);
