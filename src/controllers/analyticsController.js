const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");

exports.monthlyAttendance = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await Attendance.aggregate([
      {
        $match: {
          companyId,
          date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.teamAttendancePercentage = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const team = await Employee.find({
      companyId,
      projectManager: req.user.employeeId,
    });

    const employeeIds = team.map((emp) => emp._id);

    const total = await Attendance.countDocuments({
      companyId,
      employeeId: { $in: employeeIds },
    });

    const present = await Attendance.countDocuments({
      companyId,
      employeeId: { $in: employeeIds },
      status: "present",
    });

    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    res.json({
      success: true,
      totalRecords: total,
      presentRecords: present,
      attendancePercentage: percentage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.productivityAnalytics = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const data = await Task.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.employeeOverview = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const active = await Employee.countDocuments({ companyId, status: "active" });
    const pending = await Employee.countDocuments({ companyId, status: "pending" });
    const onboarding = await Employee.countDocuments({ companyId, status: "onboarding" });
    const inactive = await Employee.countDocuments({ companyId, status: "inactive" });

    res.json({
      success: true,
      data: { active, pending, onboarding, inactive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.departmentWiseEmployees = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const data = await Employee.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: "$department",
          employees: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};