const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
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

    documentType: {
      type: String,
      enum: [
        "aadhaar",
        "pan",
        "resume",
        "offer_letter",
        "experience_letter",
        "other",
      ],
      required: true,
    },

    fileName: String,
    originalName: String,
    fileUrl: String,
    mimeType: String,
    fileSize: Number,

    status: {
      type: String,
      enum: ["uploaded", "verified", "rejected"],
      default: "uploaded",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);