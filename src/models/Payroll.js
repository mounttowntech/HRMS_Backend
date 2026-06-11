const mongoose = require("mongoose");

const payrollEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    employeeCode: String,
    employeeName: String,
    role: String,

    totalWorkingDays: {
      type: Number,
      default: 0,
    },

    presentDays: {
      type: Number,
      default: 0,
    },

    absentDays: {
      type: Number,
      default: 0,
    },

    basicSalary: {
      type: Number,
      default: 0,
    },

    perDaySalary: {
      type: Number,
      default: 0,
    },

    grossEarning: {
      type: Number,
      default: 0,
    },

    pfDeduction: {
      type: Number,
      default: 0,
    },

    esiDeduction: {
      type: Number,
      default: 0,
    },

    totalDeduction: {
      type: Number,
      default: 0,
    },

    netSalary: {
      type: Number,
      default: 0,
    },

    payslipUrl: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const payrollSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    payrollName: {
      type: String,
      required: true,
    },

    period: {
      type: String,
      required: true,
    },

    totalEmployees: {
      type: Number,
      default: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    totalDeductions: {
      type: Number,
      default: 0,
    },

    netPayroll: {
      type: Number,
      default: 0,
    },

    employees: [payrollEmployeeSchema],

    status: {
      type: String,
      enum: ["Processed", "Pending", "Completed"],
      default: "Processed",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ companyId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);