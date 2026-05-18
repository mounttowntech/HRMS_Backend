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
    date: { type: Date, required: true },
    punchIn: Date,
    workStartedAt: Date,
    breaks: [
      { breakIn: Date, breakOut: Date, minutes: { type: Number, default: 0 } },
    ],
    punchOut: Date,
    workingMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["present", "absent", "half_day", "leave"],
      default: "present",
    },
  },
  { timestamps: true },
);
schema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("Attendance", schema);
