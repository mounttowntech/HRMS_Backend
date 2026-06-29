const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    permissionNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    department: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    permissionDate: {
      type: Date,
      required: true,
    },

    fromTime: {
      type: String,
      required: true,
    },

    toTime: {
      type: String,
      required: true,
    },

    totalHours: {
      type: Number,
      required: true,
      enum: [1, 2],
    },

    permissionType: {
      type: String,
      enum: ["1 Hour", "2 Hours"],
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    managerRemarks: {
      type: String,
      default: "",
    },

    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedDate: {
      type: Date,
      default: null,
    },

    monthlyHoursUsed: {
      type: Number,
      default: 0,
    },

    remainingMonthlyHours: {
      type: Number,
      default: 2,
    },

    month: Number,
    year: Number,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true, versionKey: false }
);

permissionSchema.pre("save", function () {
  if (!this.permissionNumber) {
    this.permissionNumber = `PERM-${Date.now()}`;
  }

  if (this.permissionDate) {
    this.month = new Date(this.permissionDate).getMonth() + 1;
    this.year = new Date(this.permissionDate).getFullYear();
  }
});

module.exports = mongoose.model("Permission", permissionSchema);