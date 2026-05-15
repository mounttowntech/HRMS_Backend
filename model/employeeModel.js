const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employeeCode: {
      type: String,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    phone: String,
    gender: String,
    dateOfBirth: Date,

    department: {
      type: String,
      enum: ["IT", "BPO", "HR", "Finance", "Admin", "Marketing"],
      required: true,
    },

    designation: {
      type: String,
      enum: [
        "Employee",
        "Team Lead",
        "Project Manager",
        "HR",
        "Admin",
        "Developer",
        "Designer",
        "BPO",
        "Digital Marketing",
      ],
      required: true,
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    joiningDate: Date,

    employeeStatus: {
      type: String,
      enum: ["Active", "Inactive", "Resigned", "Terminated"],
      default: "Inactive",
    },

    leaveBalance: {
      paidLeave: {
        type: Number,
        default: 12,
      },
      sickLeave: {
        type: Number,
        default: 8,
      },
      plannedLeave: {
        type: Number,
        default: 5,
      },
      unplannedLeave: {
        type: Number,
        default: 2,
      },
      permissionHours: {
        type: Number,
        default: 12,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);