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
    fileUrl: String,
    status: {
      type: String,
      enum: ["uploaded", "verified", "rejected"],
      default: "uploaded",
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    remarks: String,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Document", schema);
