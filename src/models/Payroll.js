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

    department: String,
    designation: String,
    shiftName: String,

    totalWorkingDays: Number,

    presentDays: Number,

    paidLeaveDays: Number,

    holidayDays: Number,

    weekOffDays: Number,

    paidDays: Number,

    absentDays: Number,

    basicSalary: Number,

    perDaySalary: Number,

    hra: Number,

    medicalAllowance: Number,

    conveyanceAllowance: Number,

    shiftAllowance: Number,

    otherAllowance: Number,

    grossEarning: Number,

    pfDeduction: Number,

    esiDeduction: Number,

    totalDeduction: Number,

    netSalary: Number,

    payslipUrl: String,
  },
  {
    _id: false,
  }
);

const payrollSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    payrollName: String,

    month: Number,

    year: Number,

    period: String,

    totalEmployees: Number,

    totalEarnings: Number,

    totalDeductions: Number,

    netPayroll: Number,

    employees: [payrollEmployeeSchema],

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processed",
        "Completed",
      ],
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index(
  {
    companyId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Payroll",
  payrollSchema
);