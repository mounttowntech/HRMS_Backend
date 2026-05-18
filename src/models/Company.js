const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    industryType: {
      type: String,
      enum: [
        "IT",
        "BPO",
        "School",
        "College",
        "Finance",
        "International Voice Process",
        "Other",
      ],
      default: "IT",
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
