const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Candidate Selected",
        "Employee Created",
        "Email Sent",
        "Onboarding In Progress",
        "Documents Uploaded",
        "HR Verified",
        "Admin Access Assigned",
        "Onboarding Completed",
        "Employee Active",
      ],
      default: "Candidate Selected",
    },

    documents: {
      aadhaar: String,
      pan: String,
      resume: String,
      educationCertificate: String,
      experienceLetter: String,
      bankDetails: String,
    },

    systemAccess: {
      emailCreated: {
        type: Boolean,
        default: false,
      },
      hrmsAccess: {
        type: Boolean,
        default: false,
      },
      laptopAssigned: {
        type: Boolean,
        default: false,
      },
      githubAccess: {
        type: Boolean,
        default: false,
      },
      jiraAccess: {
        type: Boolean,
        default: false,
      },
      crmAccess: {
        type: Boolean,
        default: false,
      },
      bpoToolAccess: {
        type: Boolean,
        default: false,
      },
    },

    hrVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    adminAccessAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Onboarding", onboardingSchema);