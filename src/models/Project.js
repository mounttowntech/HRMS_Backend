const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    teamlead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    projectmanager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    startDate: Date,
    dueDate: Date,

    progress: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "created",
        "assigned",
        "in_progress",
        "completed",
        "closed",
      ],
      default: "created",
    },
  },
  { timestamps: true }
);

projectSchema.index(
  { companyId: 1, clientId: 1, projectName: 1 },
  { unique: true }
);

module.exports = mongoose.model("Project", projectSchema);