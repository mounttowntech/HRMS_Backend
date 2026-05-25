const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    industryTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndustryType",
      required: true,
    },

    clientName: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
    },

    address: {
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

clientSchema.index(
  { companyId: 1, email: 1 },
  { unique: true }
);

module.exports = mongoose.model("Client", clientSchema);