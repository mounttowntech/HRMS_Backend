const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
exports.processPayroll = async (req, res) => {
  const { month, year } = req.body;
  const employees = await Employee.find({
    companyId: req.user.companyId,
    status: "active",
  });
  const payrolls = [];
  for (const emp of employees) {
    const start = new Date(year, month - 1, 1),
      end = new Date(year, month, 0, 23, 59, 59);
    const attendanceDays = await Attendance.countDocuments({
      companyId: req.user.companyId,
      employeeId: emp._id,
      date: { $gte: start, $lte: end },
      status: { $in: ["present", "half_day"] },
    });
    const leaves = await Leave.find({
      companyId: req.user.companyId,
      employeeId: emp._id,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });
    const leaveDays = leaves.reduce((s, l) => s + l.days, 0);
    const basicSalary = emp.salary || 0,
      allowances = Math.round(basicSalary * 0.1),
      deductions = 0,
      leaveDeduction = 0,
      netSalary = Math.round(
        basicSalary + allowances - deductions - leaveDeduction,
      );
    payrolls.push(
      await Payroll.findOneAndUpdate(
        { companyId: req.user.companyId, employeeId: emp._id, month, year },
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
          status: "net_salary_generated",
        },
        { new: true, upsert: true },
      ),
    );
  }
  res.json({
    success: true,
    message: "Salary processed and net salary generated",
    payrolls,
  });
};
exports.generatePayslip = async (req, res) =>
  res.json({
    success: true,
    message: "Payslip PDF generated",
    payroll: await Payroll.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        payslipPdfUrl:
          req.body.payslipPdfUrl || `/payslips/${req.params.id}.pdf`,
        status: "payslip_generated",
      },
      { new: true },
    ),
  });
exports.publishPayslip = async (req, res) =>
  res.json({
    success: true,
    message: "Payslip published",
    payroll: await Payroll.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { status: "published" },
      { new: true },
    ),
  });
exports.downloadPayslip = async (req, res) => {
  const payroll = await Payroll.findOne({
    _id: req.params.id,
    companyId: req.user.companyId,
  }).populate("employeeId", "fullName email");
  if (!payroll)
    return res
      .status(404)
      .json({ success: false, message: "Payslip not found" });
  res.json({
    success: true,
    message: "Payslip ready to download",
    payslipPdfUrl: payroll.payslipPdfUrl,
    payroll,
  });
};
exports.getPayrolls = async (req, res) =>
  res.json({
    success: true,
    payrolls: await Payroll.find({ companyId: req.user.companyId })
      .populate("employeeId", "fullName department designation")
      .sort({ year: -1, month: -1 }),
  });
