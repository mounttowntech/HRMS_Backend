const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    projectName: { type: String, required: true },
    description: String,
    clientName: String,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    startDate: Date,
    dueDate: Date,
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["created", "assigned", "in_progress", "completed", "closed"],
      default: "created",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Project", schema);
