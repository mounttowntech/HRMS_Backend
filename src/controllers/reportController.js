const Employee = require("../models/Employee"),
  Attendance = require("../models/Attendance"),
  Leave = require("../models/Leave"),
  Payroll = require("../models/Payroll"),
  Task = require("../models/Task");
exports.summaryReport = async (req, res) => {
  const companyId = req.user.companyId;
  const total =
    (
      await Payroll.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: "$netSalary" } } },
      ])
    )[0]?.total || 0;
  res.json({
    success: true,
    report: {
      totalEmployees: await Employee.countDocuments({ companyId }),
      activeEmployees: await Employee.countDocuments({
        companyId,
        status: "active",
      }),
      pendingLeaves: await Leave.countDocuments({
        companyId,
        status: { $in: ["pending_manager", "pending_hr"] },
      }),
      approvedLeaves: await Leave.countDocuments({
        companyId,
        status: "approved",
      }),
      attendanceRecords: await Attendance.countDocuments({ companyId }),
      openTasks: await Task.countDocuments({
        companyId,
        status: { $ne: "closed" },
      }),
      closedTasks: await Task.countDocuments({ companyId, status: "closed" }),
      payrollTotal: total,
    },
  });
};
