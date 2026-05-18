const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const { calculateDays } = require("../utils/calcDays");
exports.applyLeave = async (req, res) => {
  const employeeId = req.user.employeeId || req.body.employeeId;
  const emp = await Employee.findOne({
    _id: employeeId,
    companyId: req.user.companyId,
  });
  if (!emp)
    return res
      .status(404)
      .json({ success: false, message: "Employee not found" });
  const days = calculateDays(req.body.fromDate, req.body.toDate);
  const bal = emp.leaveBalance?.[req.body.leaveType] || 0;
  if (bal < days) {
    const leave = await Leave.create({
      ...req.body,
      companyId: req.user.companyId,
      employeeId,
      days,
      balanceAvailable: false,
      status: "balance_rejected",
    });
    return res
      .status(400)
      .json({
        success: false,
        message: "Leave rejected. Balance not available",
        leave,
      });
  }
  const leave = await Leave.create({
    ...req.body,
    companyId: req.user.companyId,
    employeeId,
    days,
    status: "pending_manager",
  });
  res
    .status(201)
    .json({
      success: true,
      message: "Leave applied and sent for manager approval",
      leave,
    });
};
exports.managerApproval = async (req, res) => {
  const leave = await Leave.findOne({
    _id: req.params.id,
    companyId: req.user.companyId,
  });
  if (!leave)
    return res.status(404).json({ success: false, message: "Leave not found" });
  const ok = req.body.approved === true;
  leave.managerApproval = {
    approvedBy: req.user.employeeId,
    status: ok ? "approved" : "rejected",
    remarks: req.body.remarks,
  };
  leave.status = ok ? "pending_hr" : "manager_rejected";
  await leave.save();
  res.json({
    success: true,
    message: ok ? "Manager approved. Sent to HR" : "Manager rejected leave",
    leave,
  });
};
exports.hrApproval = async (req, res) => {
  const leave = await Leave.findOne({
    _id: req.params.id,
    companyId: req.user.companyId,
  });
  if (!leave)
    return res.status(404).json({ success: false, message: "Leave not found" });
  const ok = req.body.approved === true;
  leave.hrApproval = {
    approvedBy: req.user.employeeId,
    status: ok ? "approved" : "rejected",
    remarks: req.body.remarks,
  };
  leave.status = ok ? "approved" : "rejected";
  if (ok) {
    const emp = await Employee.findById(leave.employeeId);
    emp.leaveBalance[leave.leaveType] = Math.max(
      0,
      emp.leaveBalance[leave.leaveType] - leave.days,
    );
    await emp.save();
    for (
      let d = new Date(leave.fromDate);
      d <= new Date(leave.toDate);
      d.setDate(d.getDate() + 1)
    ) {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      await Attendance.findOneAndUpdate(
        {
          companyId: req.user.companyId,
          employeeId: leave.employeeId,
          date: day,
        },
        {
          companyId: req.user.companyId,
          employeeId: leave.employeeId,
          date: day,
          status: "leave",
        },
        { upsert: true },
      );
    }
  }
  await leave.save();
  res.json({
    success: true,
    message: ok
      ? "Leave approved and attendance updated"
      : "Leave rejected by HR",
    leave,
  });
};
exports.getLeaves = async (req, res) =>
  res.json({
    success: true,
    leaves: await Leave.find({ companyId: req.user.companyId })
      .populate("employeeId", "fullName department designation")
      .sort({ createdAt: -1 }),
  });
