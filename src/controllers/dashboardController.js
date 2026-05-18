const Employee = require("../models/Employee"),
  Leave = require("../models/Leave"),
  Attendance = require("../models/Attendance"),
  Payroll = require("../models/Payroll"),
  Task = require("../models/Task"),
  Project = require("../models/Project"),
  Onboarding = require("../models/Onboarding"),
  Document = require("../models/Document");
exports.employerDashboard = async (req, res) => {
  const companyId = req.user.companyId;
  res.json({
    success: true,
    dashboard: {
      totalEmployees: await Employee.countDocuments({ companyId }),
      activeProjects: await Project.countDocuments({
        companyId,
        status: { $ne: "closed" },
      }),
      pendingLeaves: await Leave.countDocuments({
        companyId,
        status: { $in: ["pending_manager", "pending_hr"] },
      }),
      payrollProcessed: await Payroll.countDocuments({ companyId }),
      openTasks: await Task.countDocuments({
        companyId,
        status: { $ne: "closed" },
      }),
    },
  });
};
exports.adminDashboard = async (req, res) => {
  const companyId = req.user.companyId;
  const departments = await Employee.distinct("department", { companyId });
  const payroll =
    (
      await Payroll.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, total: { $sum: "$netSalary" } } },
      ])
    )[0]?.total || 0;
  res.json({
    success: true,
    dashboard: {
      totalEmployees: await Employee.countDocuments({ companyId }),
      totalDepartments: departments.length,
      presentToday: await Attendance.countDocuments({
        companyId,
        status: "present",
      }),
      totalLeaves: await Leave.countDocuments({ companyId }),
      payrollThisMonth: payroll,
      pendingApprovals: await Leave.find({
        companyId,
        status: { $in: ["pending_manager", "pending_hr"] },
      }).limit(5),
      recentEmployees: await Employee.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(5),
    },
  });
};
exports.hrDashboard = async (req, res) => {
  const companyId = req.user.companyId;
  res.json({
    success: true,
    dashboard: {
      totalEmployees: await Employee.countDocuments({
        companyId,
        status: "active",
      }),
      newJoinings: await Employee.countDocuments({
        companyId,
        status: "candidate_selected",
      }),
      onboarding: await Onboarding.countDocuments({
        companyId,
        status: { $ne: "completed" },
      }),
      leaveRequests: await Leave.countDocuments({
        companyId,
        status: "pending_hr",
      }),
      documentsPending: await Document.countDocuments({
        companyId,
        status: "uploaded",
      }),
    },
  });
};
exports.employeeDashboard = async (req, res) => {
  const companyId = req.user.companyId,
    employeeId = req.user.employeeId;
  const employee = await Employee.findById(employeeId);
  res.json({
    success: true,
    dashboard: {
      employee,
      attendanceToday: await Attendance.findOne({ companyId, employeeId }).sort(
        { date: -1 },
      ),
      leaveBalance: employee?.leaveBalance,
      myTasks: await Task.find({ companyId, assignedTo: employeeId })
        .sort({ createdAt: -1 })
        .limit(10),
      latestPayslip: await Payroll.findOne({ companyId, employeeId }).sort({
        year: -1,
        month: -1,
      }),
    },
  });
};
exports.teamLeadDashboard = async (req, res) => {
  const companyId = req.user.companyId;
  const team = await Employee.find({
    companyId,
    reportingManager: req.user.employeeId,
  });
  const ids = team.map((e) => e._id);
  res.json({
    success: true,
    dashboard: {
      teamMembersCount: team.length,
      teamMembers: team,
      pendingTasks: await Task.countDocuments({
        companyId,
        assignedTo: { $in: ids },
        status: { $ne: "closed" },
      }),
      leaveRequests: await Leave.find({
        companyId,
        employeeId: { $in: ids },
        status: "pending_manager",
      }).populate("employeeId", "fullName"),
    },
  });
};
exports.projectManagerDashboard = async (req, res) => {
  const companyId = req.user.companyId;
  res.json({
    success: true,
    dashboard: {
      activeProjects: await Project.countDocuments({
        companyId,
        projectManager: req.user.employeeId,
        status: { $ne: "closed" },
      }),
      tasksInProgress: await Task.countDocuments({
        companyId,
        status: "in_progress",
      }),
      tasksCompleted: await Task.countDocuments({
        companyId,
        status: "closed",
      }),
      overdueTasks: await Task.countDocuments({
        companyId,
        dueDate: { $lt: new Date() },
        status: { $ne: "closed" },
      }),
      projects: await Project.find({
        companyId,
        projectManager: req.user.employeeId,
      }).limit(10),
    },
  });
};
