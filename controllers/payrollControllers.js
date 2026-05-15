const Payroll = require("../model/payRollModel");
const Employee = require("../model/employeeModel");

exports.generatePayroll = async (req, res) => {
  try {
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      leaveDeduction,
      taxDeduction,
      payslipUrl,
    } = req.body;

    const netSalary =
      Number(basicSalary) +
      Number(allowances || 0) -
      Number(deductions || 0) -
      Number(leaveDeduction || 0) -
      Number(taxDeduction || 0);

    const payroll = await Payroll.create({
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      leaveDeduction,
      taxDeduction,
      netSalary,
      payslipUrl,
      status: "Generated",
    });

    res.status(201).json({
      success: true,
      message: "Payroll generated successfully",
      payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const payslips = await Payroll.find({
      employeeId: employee._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payslips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find()
      .populate({
        path: "employeeId",
        populate: {
          path: "userId",
          select: "userName email role",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payrolls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};