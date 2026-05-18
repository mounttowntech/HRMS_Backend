const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    assetType: {
      type: String,
      enum: ["laptop", "desktop", "headset", "mobile", "other"],
      default: "laptop",
    },
    assetCode: String,
    assetName: String,
    assignedDate: Date,
    returnDate: Date,
    status: {
      type: String,
      enum: ["available", "assigned", "returned", "damaged"],
      default: "available",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Asset", schema);
