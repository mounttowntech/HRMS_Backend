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

    leaveType: {
      type: String,
      enum: ["paid", "sick", "casual"],
      required: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    days: {
      type: Number,
      required: true,
    },

    reason: String,

    documents: [
      {
        documentType: {
          type: String,
          enum: ["medical_certificate", "marriage_invitation", "other"],
          default: "other",
        },
        fileName: String,
        fileUrl: String,
        mimeType: String,
      },
    ],

    balanceAvailable: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: [
        "balance_rejected",
        "pending_manager",
        "manager_rejected",
        "pending_hr",
        "approved",
        "rejected",
      ],
      default: "pending_manager",
    },

    managerApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      remarks: String,
    },

    hrApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      remarks: String,
    },

    adminApproval: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      remarks: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", schema);