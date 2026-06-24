const mongoose = require("mongoose");

const hiringUpdateSchema = new mongoose.Schema(
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

    jobPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    stage: {
      type: String,
      enum: [
        "applied",
        "phone_screen",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      default: "applied",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HiringUpdate", hiringUpdateSchema);