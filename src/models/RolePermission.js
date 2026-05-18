const mongoose = require("mongoose");
const schema = new mongoose.Schema(
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
      dashboard: { type: Boolean, default: true },
      createCompany: { type: Boolean, default: false },
      createRoles: { type: Boolean, default: false },
      addEmployees: { type: Boolean, default: false },
      assignProjects: { type: Boolean, default: false },
      monitorWork: { type: Boolean, default: false },
      approveLeave: { type: Boolean, default: false },
      processPayroll: { type: Boolean, default: false },
      generateReports: { type: Boolean, default: false },
      punchAttendance: { type: Boolean, default: false },
      viewTasks: { type: Boolean, default: false },
      completeWork: { type: Boolean, default: false },
      applyLeave: { type: Boolean, default: false },
      uploadDocuments: { type: Boolean, default: false },
      downloadPayslip: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);
schema.index({ companyId: 1, roleName: 1 }, { unique: true });
module.exports = mongoose.model("RolePermission", schema);
