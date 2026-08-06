const mongoose = require("mongoose");

const payslipCalculationSchema = new mongoose.Schema(
  {
    totalWorkingDaysPerMonth: {
      type: Number,
      required: true,
    },
    employeePFPercentage: {
      type: Number,
      required: true,   
  },
  employerPFPercentage: {
    type: Number,
    required: true,
    },
    employeeESIPercentage: {
      type: Number,
      required: true,
    },
    employerESIPercentage: {
      type: Number,
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("PayslipCalculation", payslipCalculationSchema);