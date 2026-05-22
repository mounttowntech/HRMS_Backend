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
      required: true,
      trim: true,
    },

    biometricUserId: {
      type: String,
      sparse: true,
      default: null,
      trim: true,
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

    profileImage: {
      type: String,
      default: "",
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      required: true,
    },

    salary: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["employee", "hr", "admin", "teamlead", "projectmanager"],
      default: "employee",
    },

    attendanceMode: {
      type: String,
      enum: ["employee_login", "google_login", "biometric", "hybrid"],
      default: "employee_login",
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

    leaveBalance: {
      sick: {
        type: Number,
        default: 10,
      },
      casual: {
        type: Number,
        default: 12,
      },
      earned: {
        type: Number,
        default: 15,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema);
