const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

const leaveKeyMap = {
  "Paid Leave": "paidLeave",
  "Sick Leave": "sickLeave",
  "Planned Leave": "plannedLeave",
  "Unplanned Leave": "unplannedLeave",
};

exports.applyLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const {
      leaveType,
      fromDate,
      toDate,
      permissionFromTime,
      permissionToTime,
      totalDays,
      reason,
    } = req.body;

    if (leaveType !== "Permission") {
      const leaveKey = leaveKeyMap[leaveType];

      if (employee.leaveBalance[leaveKey] < totalDays) {
        return res.status(400).json({
          success: false,
          message: "Insufficient leave balance",
        });
      }
    }

    const leave = await Leave.create({
      employeeId: employee._id,
      leaveType,
      fromDate,
      toDate,
      permissionFromTime,
      permissionToTime,
      totalDays,
      reason,
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.managerApproveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findById(leaveId);

    leave.status = "Manager Approved";
    leave.managerApproval = {
      approvedBy: req.user.id,
      approvedAt: new Date(),
      remarks,
    };

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved by manager",
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.hrApproveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { remarks } = req.body;

    const leave = await Leave.findById(leaveId);

    if (leave.status !== "Manager Approved") {
      return res.status(400).json({
        success: false,
        message: "Manager approval required first",
      });
    }

    const employee = await Employee.findById(leave.employeeId);

    if (leave.leaveType !== "Permission") {
      const leaveKey = leaveKeyMap[leave.leaveType];
      employee.leaveBalance[leaveKey] -= leave.totalDays;
    }

    leave.status = "HR Approved";
    leave.hrApproval = {
      approvedBy: req.user.id,
      approvedAt: new Date(),
      remarks,
    };

    await employee.save();
    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave approved by HR",
      leave,
      leaveBalance: employee.leaveBalance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { reason } = req.body;

    const leave = await Leave.findById(leaveId);

    leave.status = "Rejected";
    leave.rejectedBy = req.user.id;
    leave.rejectionReason = reason;

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave rejected",
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const leaves = await Leave.find({
      employeeId: employee._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leaveBalance: employee.leaveBalance,
      leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
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
      leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};