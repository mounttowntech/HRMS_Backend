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
    accessType: {
      type: String,
      enum: ["email", "github", "jira", "crm", "dialer", "other"],
      required: true,
    },
    username: String,
    status: {
      type: String,
      enum: ["created", "pending", "active", "revoked"],
      default: "created",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("AccessRequest", schema);
