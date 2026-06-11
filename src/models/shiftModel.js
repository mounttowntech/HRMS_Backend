const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    shiftName: {
      type: String,
      required: true,
      trim: true,
    },

    shiftType: {
      type: String,
      enum: [
        "general",
        "afternoon",
        "evening",
        "night",
        "rotational",
      ],
      default: "general",
    },

    startTime: {
      type: String,
      required: true,
      default: "09:00",
    },

    endTime: {
      type: String,
      required: true,
      default: "18:00",
    },

    graceMinutes: {
      type: Number,
      default: 10,
      min: 0,
    },

    weekOff: {
      type: [String],
      default: ["Sunday"],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate shift names inside same company
shiftSchema.index(
  {
    companyId: 1,
    shiftName: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Shift", shiftSchema);