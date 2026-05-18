const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    processName: String,
    shift: String,
    voiceTrainingCompleted: { type: Boolean, default: false },
    mockCallStatus: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: [
        "training",
        "process_assigned",
        "shift_assigned",
        "mock_calls",
        "retraining",
        "live_process",
      ],
      default: "training",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("BpoProcess", schema);
