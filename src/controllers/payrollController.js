const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const sendMail = require("../utils/sendMail");

const payrollPayslipTemplate = require(
  "../templates/payrollPayslipTemplate"
);

const getMonthName = (month, year) => {
  return new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
  });
};

// ===============================
// PROCESS PAYROLL
// all employees OR single employee
// ===============================
exports.processPayroll = async (req, res) => {
  try {
    const { month, year, employeeId } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const employeeFilter = {
      companyId: req.user.companyId,
      status: "active",
    };

    if (employeeId) {
      employeeFilter._id = employeeId;
    }

    const employees = await Employee.find(employeeFilter);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active employees found",
      });
    }

    const payrolls = [];

    for (const emp of employees) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const attendanceDays = await Attendance.countDocuments({
        companyId: req.user.companyId,
        employeeId: emp._id,
        date: {
          $gte: start,
          $lte: end,
        },
        status: {
          $in: ["present", "half_day"],
        },
      });

      const leaves = await Leave.find({
        companyId: req.user.companyId,
        employeeId: emp._id,
        status: "approved",
        fromDate: {
          $lte: end,
        },
        toDate: {
          $gte: start,
        },
      });

      const leaveDays = leaves.reduce((sum, leave) => {
        return sum + (leave.days || 0);
      }, 0);

      const basicSalary = emp.salary || 0;
      const allowances = Math.round(basicSalary * 0.1);
      const deductions = 0;
      const leaveDeduction = 0;

      const netSalary = Math.round(
        basicSalary + allowances - deductions - leaveDeduction
      );

      const payroll = await Payroll.findOneAndUpdate(
        {
          companyId: req.user.companyId,
          employeeId: emp._id,
          month,
          year,
        },
        {
          companyId: req.user.companyId,
          employeeId: emp._id,
          month,
          year,
          attendanceDays,
          leaveDays,
          basicSalary,
          allowances,
          deductions,
          leaveDeduction,
          netSalary,
          payslipPdfUrl: "",
          status: "net_salary_generated",
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      ).populate("employeeId", "employeeCode fullName email salary");

      payrolls.push(payroll);
    }

    res.status(200).json({
      success: true,
      message: employeeId
        ? "Salary processed for selected employee"
        : "Salary processed for all active employees",
      count: payrolls.length,
      payrolls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GENERATE PAYSLIP
// use payroll _id only
// ===============================
exports.generatePayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("employeeId", "employeeCode fullName email");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    const monthName = getMonthName(payroll.month, payroll.year);

    payroll.payslipPdfUrl = `/payslips/${payroll.employeeId.employeeCode}-${monthName}-${payroll.year}.pdf`;
    payroll.status = "payslip_generated";

    await payroll.save();

    res.status(200).json({
      success: true,
      message: "Payslip PDF generated",
      employeeCode: payroll.employeeId.employeeCode,
      employeeName: payroll.employeeId.fullName,
      payslipPdfUrl: payroll.payslipPdfUrl,
      payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// PUBLISH PAYSLIP + SEND MAIL
// ===============================
exports.publishPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        status: "published",
      },
      {
        new: true,
      }
    ).populate("employeeId", "employeeCode fullName email");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    const monthName = getMonthName(payroll.month, payroll.year);
    const formattedMonth = `${monthName} ${payroll.year}`;

    if (payroll.employeeId?.email) {
      await sendMail({
        to: payroll.employeeId.email,
        subject: `Payslip Published - ${formattedMonth}`,
        html: payrollPayslipTemplate(
          payroll.employeeId.fullName,
          formattedMonth,
          payroll.netSalary,
          "Mounttown HRMS"
        ),
      });
    }

    res.status(200).json({
      success: true,
      message: "Payslip published and email sent",
      employeeCode: payroll.employeeId.employeeCode,
      employeeName: payroll.employeeId.fullName,
      payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// DOWNLOAD PAYSLIP
// ===============================
exports.downloadPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("employeeId", "employeeCode fullName email");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payslip ready to download",
      employeeCode: payroll.employeeId.employeeCode,
      employeeName: payroll.employeeId.fullName,
      payslipPdfUrl: payroll.payslipPdfUrl,
      payroll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET ALL PAYROLLS
// ===============================
exports.getPayrolls = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    if (req.query.month) {
      filter.month = Number(req.query.month);
    }

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    const payrolls = await Payroll.find(filter)
      .populate("employeeId", "employeeCode fullName email salary")
      .sort({
        year: -1,
        month: -1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: payrolls.length,
      payrolls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};