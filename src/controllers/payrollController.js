const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");

const {
  getMonthRangeByMonthYear,
} = require("../utils/dashboardUtils");

const generatePayslip = require("../utils/generatePayslip");

const roundAmount = (amount) => {
  return Number((amount || 0).toFixed(2));
};

exports.processPayroll = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const existingPayroll = await Payroll.findOne({
      companyId,
      month,
      year,
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: "Payroll already processed for this month",
      });
    }

    const { start, end } = getMonthRangeByMonthYear(month, year);

    const totalWorkingDays = new Date(year, month, 0).getDate();

    const employees = await Employee.find({
      companyId,
      status: "active",
      role: {
        $in: ["employee", "teamlead", "projectmanager", "hr"],
      },
    }).lean();

    const payrollEmployees = [];

    let totalEarnings = 0;
    let totalDeductions = 0;
    let netPayroll = 0;

    for (const employee of employees) {
      const presentDays = await Attendance.countDocuments({
        companyId,
        employeeId: employee._id,
        date: { $gte: start, $lte: end },
        status: "present",
      });

      const absentDays = totalWorkingDays - presentDays;

      const basicSalary = Number(employee.basicSalary || employee.salary || 0);

      const perDaySalary = basicSalary / totalWorkingDays;

      const grossEarning = perDaySalary * presentDays;

      const pfDeduction = grossEarning * 0.12;

      const esiDeduction = grossEarning <= 21000 ? grossEarning * 0.0075 : 0;

      const totalDeduction = pfDeduction + esiDeduction;

      const netSalary = grossEarning - totalDeduction;

      const payrollData = {
        totalWorkingDays,
        presentDays,
        absentDays,
        basicSalary: roundAmount(basicSalary),
        perDaySalary: roundAmount(perDaySalary),
        grossEarning: roundAmount(grossEarning),
        pfDeduction: roundAmount(pfDeduction),
        esiDeduction: roundAmount(esiDeduction),
        totalDeduction: roundAmount(totalDeduction),
        netSalary: roundAmount(netSalary),
      };

      const payslipUrl = await generatePayslip({
        employee,
        payrollData,
        month,
        year,
      });

      payrollEmployees.push({
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        employeeName: employee.fullName,
        role: employee.role,

        ...payrollData,

        payslipUrl,
      });

      totalEarnings += payrollData.grossEarning;
      totalDeductions += payrollData.totalDeduction;
      netPayroll += payrollData.netSalary;
    }

    const payroll = await Payroll.create({
      companyId,
      month,
      year,
      payrollName: `${month}-${year} Payroll`,
      period: `${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString(
        "en-IN"
      )}`,
      totalEmployees: employees.length,
      totalEarnings: roundAmount(totalEarnings),
      totalDeductions: roundAmount(totalDeductions),
      netPayroll: roundAmount(netPayroll),
      employees: payrollEmployees,
      processedBy: req.user.id,
      status: "Completed",
    });

    res.status(201).json({
      success: true,
      message: "Payroll processed successfully",
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payroll processing failed",
      error: error.message,
    });
  }
};
// GET ALL PAYROLLS
exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({
      companyId: req.user.companyId,
    })
      .sort({ year: -1, month: -1, createdAt: -1 })
      .select("-employees");

    res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payrolls",
      error: error.message,
    });
  }
};

// GET SINGLE PAYROLL
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("employees.employeeId", "fullName employeeCode email role");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payroll",
      error: error.message,
    });
  }
};

// DELETE PAYROLL
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payroll deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete payroll",
      error: error.message,
    });
  }
};
exports.getPayrollDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const latestPayroll = await Payroll.findOne({ companyId })
      .sort({ createdAt: -1 })
      .lean();

    const totalEmployees = latestPayroll?.totalEmployees || 0;

    const payrollOverview = await Payroll.find({ companyId })
      .sort({ year: -1, month: -1 })
      .limit(6)
      .select("month year totalEarnings totalDeductions netPayroll")
      .lean();

    const recentPayrolls = await Payroll.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "payrollName period totalEmployees totalEarnings totalDeductions netPayroll status"
      )
      .lean();

    res.status(200).json({
      success: true,
      data: {
        dashboardCard: {
          totalEmployees,
          totalEarnings: latestPayroll?.totalEarnings || 0,
          totalDeductions: latestPayroll?.totalDeductions || 0,
          netPayroll: latestPayroll?.netPayroll || 0,
        },

        payrollOverview: payrollOverview.map((item) => ({
          monthYear: `${item.month}/${item.year}`,
          totalEarning: item.totalEarnings,
          totalDeduction: item.totalDeductions,
          netPayroll: item.netPayroll,
        })),

        recentPayrolls: recentPayrolls.map((item) => ({
          payrollName: item.payrollName,
          period: item.period,
          employees: item.totalEmployees,
          totalEarning: item.totalEarnings,
          totalDeductions: item.totalDeductions,
          netPayroll: item.netPayroll,
          status: item.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payroll dashboard failed",
      error: error.message,
    });
  }
};

exports.getEmployeePayslip = async (req, res) => {
  try {
    const { payrollId, employeeId } = req.params;

    const payroll = await Payroll.findOne({
      _id: payrollId,
      companyId: req.user.companyId,
      "employees.employeeId": employeeId,
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found",
      });
    }

    const employeePayslip = payroll.employees.find(
      (item) => item.employeeId.toString() === employeeId
    );

    res.status(200).json({
      success: true,
      data: employeePayslip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payslip",
      error: error.message,
    });
  }
};