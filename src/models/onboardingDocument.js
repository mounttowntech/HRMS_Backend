const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: String,
    fileUrl: String,
    mimeType: String,
    size: Number,
    status: {
      type: String,
      enum: ["pending", "uploaded", "verified", "rejected"],
      default: "pending",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const onboardingDocumentSchema = new mongoose.Schema(
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
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    aadhaar: {
      type: fileSchema,
      default: () => ({ status: "pending" }),
    },

    pan: {
      type: fileSchema,
      default: () => ({ status: "pending" }),
    },

    tenthMarksheet: {
      type: fileSchema,
      default: () => ({ status: "pending" }),
    },

    twelfthMarksheet: {
      type: fileSchema,
      default: () => ({ status: "pending" }),
    },

    experienceLetter: {
      type: fileSchema,
      default: () => ({ status: "pending" }),
    },

    salarySlip: {
      type: fileSchema,
      default: () => ({ status: "pending" }),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "OnboardingDocument",
  onboardingDocumentSchema
);