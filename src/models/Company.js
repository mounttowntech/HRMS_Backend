const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    industryTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryType",
      required: true,
    },

    email: { type: String, required: true, lowercase: true },
    phone: String,
    address: String,
    website: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Company", schema);
