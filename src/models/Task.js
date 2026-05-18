const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true },
    description: String,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: Date,
    dailyUpdates: [
      {
        updateText: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    review: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      status: {
        type: String,
        enum: ["pending", "approved", "rework"],
        default: "pending",
      },
      remarks: String,
    },
    status: {
      type: String,
      enum: [
        "assigned",
        "started",
        "in_progress",
        "completed",
        "review",
        "rework",
        "closed",
      ],
      default: "assigned",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Task", schema);
