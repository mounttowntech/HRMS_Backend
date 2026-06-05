const mongoose = require("mongoose");

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

    aadhaar: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      size: Number,
      status: {
        type: String,
        enum: ["uploaded", "verified", "rejected"],
        default: "uploaded",
      },
    },

    pan: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      size: Number,
      status: {
        type: String,
        enum: ["uploaded", "verified", "rejected"],
        default: "uploaded",
      },
    },

    tenthMarksheet: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      size: Number,
      status: {
        type: String,
        enum: ["uploaded", "verified", "rejected"],
        default: "uploaded",
      },
    },

    twelfthMarksheet: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      size: Number,
      status: {
        type: String,
        enum: ["uploaded", "verified", "rejected"],
        default: "uploaded",
      },
    },

    experienceLetter: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      size: Number,
      status: {
        type: String,
        enum: ["uploaded", "verified", "rejected"],
        default: "uploaded",
      },
    },

    salarySlip: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      size: Number,
      status: {
        type: String,
        enum: ["uploaded", "verified", "rejected"],
        default: "uploaded",
      },
    },

    remarks: String,

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "OnboardingDocument",
  onboardingDocumentSchema
);