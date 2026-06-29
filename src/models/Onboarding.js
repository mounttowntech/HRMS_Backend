const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    welcomeCompleted: { type: Boolean, default: false },
    personalInfoCompleted: { type: Boolean, default: false },
    jobInfoCompleted: { type: Boolean, default: false },
    documentsUploaded: { type: Boolean, default: false },
    hrVerification: { type: Boolean, default: false },
    adminAccessAssigned: { type: Boolean, default: false },
    accountSetup: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["started", "admin_access", "completed","hr_verification"],
      default: "started",
    },

    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Onboarding", schema);