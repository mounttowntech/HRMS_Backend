const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      enum: [
        "Casual Leave",
        "Sick Leave",
        "Maternity Leave",
        "Paternity Leave",
        "Permission",
        "Earned Leave"
      ],
      required: true,
    },

    fromDate: Date,
    toDate: Date,

    permissionFromTime: String,
    permissionToTime: String,

    totalDays: {
      type: Number,
      default: 1,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Manager Approved",
        "HR Approved",
        "Rejected",
      ],
      default: "Pending",
    },

    managerApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      remarks: String,
    },

    hrApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      remarks: String,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rejectionReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);