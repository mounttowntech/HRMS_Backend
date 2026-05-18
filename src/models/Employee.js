const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeCode: { type: String, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    department: String,
    designation: String,
    role: {
      type: String,
      enum: ["admin", "hr", "employee", "teamlead", "projectmanager"],
      default: "employee",
    },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    joiningDate: Date,
    salary: { type: Number, default: 0 },
    shift: String,
    processName: String,
    status: {
      type: String,
      enum: [
        "candidate_selected",
        "onboarding",
        "active",
        "inactive",
        "offboarding",
        "offboarded",
      ],
      default: "candidate_selected",
    },
    leaveBalance: {
      paid: { type: Number, default: 12 },
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 10 },
    },
  },
  { timestamps: true },
);
schema.index({ companyId: 1, email: 1 }, { unique: true });
module.exports = mongoose.model("Employee", schema);
