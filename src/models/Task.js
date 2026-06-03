const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Assigned employee is required"],
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "assigned",
        "started",
        "in_progress",
        "completed",
        "under_review",
        "rework",
        "closed",
      ],
      default: "assigned",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    dailyUpdates: [
      {
        updateText: {
          type: String,
          trim: true,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          default: null,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    review: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rework"],
        default: "pending",
      },
      remarks: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);