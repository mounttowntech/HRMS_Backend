const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    roleName: {
      type: String,
      enum: [
        "employer",
        "admin",
        "hr",
        "employee",
        "teamlead",
        "projectmanager",
      ],
      required: true,
    },

    permissions: {
      dashboard: [{ type: String }],
      employees: [{ type: String }],
      departments: [{ type: String }],
      attendance: [{ type: String }],
      leave: [{ type: String }],
      payroll: [{ type: String }],
      projects: [{ type: String }],
      tasks: [{ type: String }],
      documents: [{ type: String }],
      assets: [{ type: String }],
      recruitment: [{ type: String }],
      onboarding: [{ type: String }],
      announcements: [{ type: String }],
      notifications: [{ type: String }],
      calendar: [{ type: String }],
      analytics: [{ type: String }],
      reports: [{ type: String }],
      roles: [{ type: String }],
    },
  },
  { timestamps: true }
);

permissionSchema.index({ companyId: 1, roleName: 1 }, { unique: true });

module.exports = mongoose.model("RolePermission", permissionSchema);