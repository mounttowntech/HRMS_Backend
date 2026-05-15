const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    employerCode: {
      type: String,
      unique: true,
    },

    ownerName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
    },

    industryType: {
      type: String,
      enum: [
        "IT Sector",
        "BPO",
        "School",
        "College",
        "Finance",
        "Manufacturing",
        "Other",
      ],
      required: true,
    },

    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    subscriptionPlan: {
      type: String,
      enum: ["Free", "Basic", "Premium", "Enterprise"],
      default: "Free",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employer", employerSchema);