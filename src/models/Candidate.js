const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    jobPostId: { type: mongoose.Schema.Types.ObjectId, ref: "JobPost" },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    resumeUrl: String,
    status: {
      type: String,
      enum: [
        "applied",
        "resume_screening",
        "screening_rejected",
        "hr_interview",
        "technical_round",
        "technical_rejected",
        "selected",
        "employee_created",
      ],
      default: "applied",
    },
    hrInterview: {
      status: {
        type: String,
        enum: ["pending", "passed", "failed"],
        default: "pending",
      },
      remarks: String,
    },
    technicalRound: {
      status: {
        type: String,
        enum: ["pending", "passed", "failed"],
        default: "pending",
      },
      remarks: String,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Candidate", schema);
