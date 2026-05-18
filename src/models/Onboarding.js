const mongoose = require("mongoose");
const schema = new mongoose.Schema(
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
    welcomeCompleted: { type: Boolean, default: false },
    personalInfoCompleted: { type: Boolean, default: false },
    jobInfoCompleted: { type: Boolean, default: false },
    documentsUploaded: { type: Boolean, default: false },
    hrVerification: { type: Boolean, default: false },
    adminAccessAssigned: { type: Boolean, default: false },
    accountSetup: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "started",
        "documents_pending",
        "hr_verification",
        "admin_access",
        "completed",
      ],
      default: "started",
    },
    completedAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Onboarding", schema);
