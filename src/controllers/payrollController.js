const path = require("path");
const fs = require("fs");

const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");

const {
  getMonthRangeByMonthYear,
} = require("../utils/dashboardutils");

const generatePayslip = require("../utils/generatePayslip");
const sendEmail = require("../utils/sendMail");

const roundAmount = (amount) => {
  return Number((amount || 0).toFixed(2));
};

const getPayslipFilePath = (payslipUrl) => {
  const cleanPath = payslipUrl.replace(/^\/+/, "");
  return path.join(__dirname, "..", cleanPath);
};

// PROCESS PAYROLL
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

    const monthName = new Date(year, month - 1).toLocaleString("en-US", {
      month: "short",
    });

    const employees = await Employee.find({
      companyId,
      status: "active",
      role: {
        $in: ["employee", "teamlead", "projectmanager", "hr"],
      },
    })
      .populate("designationId", "name designationName")
      .populate("shiftId", "shiftName name shiftType")
      .lean();

    const payrollEmployees = [];

    let totalEarnings = 0;
    let totalDeductions = 0;
    let netPayroll = 0;

    for (const employee of employees) {
      const shiftName =
        employee.shiftId?.shiftName ||
        employee.shiftId?.name ||
        employee.shiftId?.shiftType ||
        employee.shiftType ||
        "N/A";

      const designation =
        employee.designationId?.name ||
        employee.designationId?.designationName ||
        employee.designation ||
        employee.role ||
        "N/A";

      const isNightShift = shiftName.toLowerCase().includes("night");

      const totalWorkingDays = isNightShift ? 22 : 24;

      const presentDays = await Attendance.countDocuments({
        companyId,
        employeeId: employee._id,
        date: { $gte: start, $lte: end },
        status: "present",
      });

      const absentDays = Math.max(0, totalWorkingDays - presentDays);

      const monthlySalary = Number(employee.salary || employee.basicSalary || 0);

      const perDaySalary =
        totalWorkingDays > 0 ? monthlySalary / totalWorkingDays : 0;

      const earnedSalary = perDaySalary * presentDays;

      const basicSalary = isNightShift
        ? earnedSalary * 0.4
        : earnedSalary * 0.5;

      const hra = basicSalary * 0.4;

      const shiftAllowance = isNightShift
        ? earnedSalary * 0.1
        : earnedSalary * 0.05;

      const medicalAllowance = earnedSalary * 0.0852;
      const conveyanceAllowance = earnedSalary * 0.0852;

      const calculatedTotal =
        basicSalary +
        hra +
        shiftAllowance +
        medicalAllowance +
        conveyanceAllowance;

      const otherAllowance = Math.max(0, earnedSalary - calculatedTotal);

      const grossEarning =
        basicSalary +
        hra +
        shiftAllowance +
        medicalAllowance +
        conveyanceAllowance +
        otherAllowance;

      const pfDeduction = basicSalary * 0.12;
      const esiDeduction = grossEarning <= 21000 ? grossEarning * 0.0075 : 0;

      const totalDeduction = pfDeduction + esiDeduction;
      const netSalary = grossEarning - totalDeduction;

      const payrollData = {
        totalWorkingDays,
        presentDays,
        absentDays,

        monthlySalary: roundAmount(monthlySalary),
        perDaySalary: roundAmount(perDaySalary),

        designation,
        shiftName,

        basicSalary: roundAmount(basicSalary),
        hra: roundAmount(hra),
        shiftAllowance: roundAmount(shiftAllowance),
        medicalAllowance: roundAmount(medicalAllowance),
        conveyanceAllowance: roundAmount(conveyanceAllowance),
        otherAllowance: roundAmount(otherAllowance),

        grossEarning: roundAmount(grossEarning),

        pfDeduction: roundAmount(pfDeduction),
        esiDeduction: roundAmount(esiDeduction),
        totalDeduction: roundAmount(totalDeduction),

        netSalary: roundAmount(netSalary),
      };

      const payslipUrl = await generatePayslip({
        employee,
        payrollData,
        monthName,
        year,
      });

      payrollEmployees.push({
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        employeeName: employee.fullName,
        role: employee.role,
        designation,
        shiftName,

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
      payrollName: `${monthName}-${year} Payroll`,
      period: `${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString(
        "en-IN"
      )}`,
      totalEmployees: employees.length,
      totalEarnings: roundAmount(totalEarnings),
      totalDeductions: roundAmount(totalDeductions),
      netPayroll: roundAmount(netPayroll),
      employees: payrollEmployees,
      processedBy: req.user.id || req.user.userId,
      status: "Completed",
    });

    return res.status(201).json({
      success: true,
      message: "Payroll processed successfully",
      data: payroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payroll processing failed",
      error: error.message,
    });
  }
};

exports.getAllPayrolls = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.employeeId) {
      filter["employees.employeeId"] = req.query.employeeId;
    }

    if (req.query.month) {
      filter.month = Number(req.query.month);
    }

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    const payrolls = await Payroll.find(filter)
      .populate("companyId", "companyName email")
      .populate("employees.employeeId", "employeeCode fullName email salary role")
      .sort({ year: -1, month: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyPayslips = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const employee = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const payrolls = await Payroll.find({
      companyId: req.user.companyId,
      "employees.employeeId": employee._id,
    })
      .populate("companyId", "companyName email")
      .populate("employees.employeeId", "employeeCode fullName email salary role")
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    const filteredPayrolls = [];

    payrolls.forEach((payroll) => {
      const employeePayslip = payroll.employees.find(
        (item) =>
          item.employeeId &&
          item.employeeId._id.toString() === employee._id.toString()
      );

      if (employeePayslip) {
        filteredPayrolls.push({
          _id: payroll._id,
          companyId: payroll.companyId,
          month: payroll.month,
          year: payroll.year,
          payrollName: payroll.payrollName,
          period: payroll.period,
          totalEmployees: payroll.totalEmployees,
          totalEarnings: payroll.totalEarnings,
          totalDeductions: payroll.totalDeductions,
          netPayroll: payroll.netPayroll,
          status: payroll.status,
          employees: [employeePayslip],
          createdAt: payroll.createdAt,
          updatedAt: payroll.updatedAt,
        });
      }
    });

    return res.status(200).json({
      success: true,
      count: filteredPayrolls.length,
      payrolls: filteredPayrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payslips",
      error: error.message,
    });
  }
};

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

    return res.status(200).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll",
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

    return res.status(200).json({
      success: true,
      data: {
        dashboardCard: {
          totalEmployees: latestPayroll?.totalEmployees || 0,
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
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: employeePayslip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payslip",
      error: error.message,
    });
  }
};

exports.downloadEmployeePayslip = async (req, res) => {
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

    if (!employeePayslip || !employeePayslip.payslipUrl) {
      return res.status(404).json({
        success: false,
        message: "Payslip PDF not generated",
      });
    }

    let filePath = getPayslipFilePath(employeePayslip.payslipUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Payslip file not found on server. Please regenerate payslip.",
        filePath,
      });
    }

    const downloadName = `${employeePayslip.employeeCode}-${payroll.month}-${payroll.year}-payslip.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName}"`
    );

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payslip download failed",
      error: error.message,
    });
  }
};

exports.regenerateEmployeePayslip = async (req, res) => {
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

    if (!employeePayslip) {
      return res.status(404).json({
        success: false,
        message: "Employee payslip not found",
      });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: req.user.companyId,
    })
      .populate("designationId", "name")
      .populate("shiftId", "shiftName name")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const monthName = new Date(payroll.year, payroll.month - 1).toLocaleString(
      "en-US",
      { month: "short" }
    );

    const payrollData = {
      totalWorkingDays: employeePayslip.totalWorkingDays,
      presentDays: employeePayslip.presentDays,
      absentDays: employeePayslip.absentDays,
      monthlySalary: employeePayslip.monthlySalary,
      perDaySalary: employeePayslip.perDaySalary,
      designation: employeePayslip.designation,
      shiftName: employeePayslip.shiftName,

      basicSalary: employeePayslip.basicSalary,
      hra: employeePayslip.hra,
      shiftAllowance: employeePayslip.shiftAllowance,
      medicalAllowance: employeePayslip.medicalAllowance,
      conveyanceAllowance: employeePayslip.conveyanceAllowance,
      otherAllowance: employeePayslip.otherAllowance,

      grossEarning: employeePayslip.grossEarning,
      pfDeduction: employeePayslip.pfDeduction,
      esiDeduction: employeePayslip.esiDeduction,
      totalDeduction: employeePayslip.totalDeduction,
      netSalary: employeePayslip.netSalary,
    };

    const payslipUrl = await generatePayslip({
      employee,
      payrollData,
      monthName,
      year: payroll.year,
    });

    employeePayslip.payslipUrl = payslipUrl;

    await payroll.save();

    return res.status(200).json({
      success: true,
      message: "Payslip regenerated successfully",
      payslipUrl,
      filePath: getPayslipFilePath(payslipUrl),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payslip regenerate failed",
      error: error.message,
    });
  }
};

exports.sendEmployeePayslipMail = async (req, res) => {
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

    if (!employeePayslip || !employeePayslip.payslipUrl) {
      return res.status(404).json({
        success: false,
        message: "Payslip PDF not generated",
      });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: req.user.companyId,
    });

    if (!employee || !employee.email) {
      return res.status(404).json({
        success: false,
        message: "Employee email not found",
      });
    }

    const filePath = getPayslipFilePath(employeePayslip.payslipUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Payslip file not found on server",
      });
    }

    await sendEmail({
      to: employee.email,
      subject: `Payslip - ${payroll.month}/${payroll.year}`,
      html: `
        <h3>Hello ${employee.fullName},</h3>
        <p>Your payslip for <b>${payroll.month}/${payroll.year}</b> is attached.</p>
        <p><b>Employee Code:</b> ${employee.employeeCode}</p>
        <p><b>Present Days:</b> ${employeePayslip.presentDays}</p>
        <p><b>Net Salary:</b> ₹${employeePayslip.netSalary}</p>
        <br/>
        <p>Regards,<br/>HR Team</p>
      `,
      attachments: [
        {
          filename: `${employee.employeeCode}-${payroll.month}-${payroll.year}-payslip.pdf`,
          path: filePath,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Payslip sent successfully",
      email: employee.email,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payslip mail failed",
      error: error.message,
    });
  }
};

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

    return res.status(200).json({
      success: true,
      message: "Payroll deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete payroll",
      error: error.message,
    });
  }
};