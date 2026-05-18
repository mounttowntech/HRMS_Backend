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
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    attendanceDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    payslipPdfUrl: String,
    status: {
      type: String,
      enum: [
        "salary_processing",
        "net_salary_generated",
        "payslip_generated",
        "published",
      ],
      default: "salary_processing",
    },
  },
  { timestamps: true },
);
schema.index(
  { companyId: 1, employeeId: 1, month: 1, year: 1 },
  { unique: true },
);
module.exports = mongoose.model("Payroll", schema);
