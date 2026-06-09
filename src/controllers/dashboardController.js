const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Onboarding = require("../models/Onboarding");
const Document = require("../models/Document");
const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");

const { getISTDateString, percentage } = require("../utils/dateHelper");

const getPayrollSummary = async (companyId) => {
  const data = await Payroll.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$grossSalary" },
        totalDeductions: { $sum: "$deductions" },
        netPayroll: { $sum: "$netSalary" },
        averageSalary: { $avg: "$netSalary" },
      },
    },
  ]);

  return (
    data[0] || {
      totalEarnings: 0,
      totalDeductions: 0,
      netPayroll: 0,
      averageSalary: 0,
    }
  );
};

exports.adminDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const attendanceDate = getISTDateString();

    const totalEmployees = await Employee.countDocuments({
      companyId,
      status: "active",
    });

    const present = await Attendance.countDocuments({
      companyId,
      attendanceDate,
      status: "present",
    });

    const onLeave = await Attendance.countDocuments({
      companyId,
      attendanceDate,
      status: "leave",
    });

    const absent = Math.max(totalEmployees - present - onLeave, 0);
    const payroll = await getPayrollSummary(companyId);

    res.json({
      success: true,
      dashboard: {
        attendanceOverview: {
          present: { count: present, percentage: percentage(present, totalEmployees) },
          onLeave: { count: onLeave, percentage: percentage(onLeave, totalEmployees) },
          absent: { count: absent, percentage: percentage(absent, totalEmployees) },
        },

        pendingApprovals: {
          leaveRequests: await Leave.countDocuments({
            companyId,
            status: { $in: ["pending", "pending_manager", "pending_hr"] },
          }),
          onboardingApprovals: await Onboarding.countDocuments({
            companyId,
            status: { $ne: "completed" },
          }),
        },

        payrollDashboard: {
          totalEmployees,
          totalEarnings: payroll.totalEarnings,
          totalDeductions: payroll.totalDeductions,
          netPayroll: payroll.netPayroll,
        },

        recruitmentDashboard: {
          openPositions: await JobPost.countDocuments({ companyId, status: "open" }),
          newApplicants: await Candidate.countDocuments({ companyId, status: "applied" }),
          interviewsScheduled: await Candidate.countDocuments({
            companyId,
            status: { $in: ["hr_interview", "technical_round"] },
          }),
        },

        talentPipeline: {
          applied: await Candidate.countDocuments({ companyId, status: "applied" }),
          screening: await Candidate.countDocuments({ companyId, status: "resume_screening" }),
          interview: await Candidate.countDocuments({
            companyId,
            status: { $in: ["hr_interview", "technical_round"] },
          }),
          hired: await Candidate.countDocuments({ companyId, status: "selected" }),
        },

        recentPayrolls: await Payroll.find({ companyId })
          .populate("employeeId", "fullName employeeCode")
          .sort({ createdAt: -1 })
          .limit(5),

        recentHiringUpdates: [
          "3 positions moved to the interview stage this week.",
          "5 candidates completed assessment tests.",
          "2 offers accepted for software engineering roles.",
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.hrDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const attendanceDate = getISTDateString();
    const payroll = await getPayrollSummary(companyId);

    res.json({
      success: true,
      dashboard: {
        totalEmployees: await Employee.countDocuments({ companyId, status: "active" }),

        attendance: {
          presentToday: await Attendance.countDocuments({
            companyId,
            attendanceDate,
            status: "present",
          }),
          onLeaveToday: await Attendance.countDocuments({
            companyId,
            attendanceDate,
            status: "leave",
          }),
          absentToday: await Attendance.countDocuments({
            companyId,
            attendanceDate,
            status: "absent",
          }),
        },

        approvals: {
          pendingLeaveRequests: await Leave.countDocuments({
            companyId,
            status: { $in: ["pending", "pending_hr"] },
          }),
          onboardingPending: await Onboarding.countDocuments({
            companyId,
            status: { $ne: "completed" },
          }),
          documentsPending: await Document.countDocuments({
            companyId,
            status: "uploaded",
          }),
        },

        payrollDashboard: payroll,

        recruitment: {
          openPositions: await JobPost.countDocuments({ companyId, status: "open" }),
          newApplicants: await Candidate.countDocuments({ companyId, status: "applied" }),
          interviewsScheduled: await Candidate.countDocuments({
            companyId,
            status: { $in: ["hr_interview", "technical_round"] },
          }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.teamLeadDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = req.user.employeeId;
    const attendanceDate = getISTDateString();

    const team = await Employee.find({
      companyId,
      reportingManager: employeeId,
      status: "active",
    });

    const teamIds = team.map((item) => item._id);

    res.json({
      success: true,
      dashboard: {
        teamMembers: team.length,

        attendance: {
          present: await Attendance.countDocuments({
            companyId,
            employeeId: { $in: teamIds },
            attendanceDate,
            status: "present",
          }),
          onLeave: await Attendance.countDocuments({
            companyId,
            employeeId: { $in: teamIds },
            attendanceDate,
            status: "leave",
          }),
          absent: await Attendance.countDocuments({
            companyId,
            employeeId: { $in: teamIds },
            attendanceDate,
            status: "absent",
          }),
        },

        tasks: {
          assigned: await Task.countDocuments({
            companyId,
            assignedTo: { $in: teamIds },
          }),
          completed: await Task.countDocuments({
            companyId,
            assignedTo: { $in: teamIds },
            status: { $in: ["completed", "closed"] },
          }),
          pending: await Task.countDocuments({
            companyId,
            assignedTo: { $in: teamIds },
            status: { $nin: ["completed", "closed"] },
          }),
        },

        leaveRequests: await Leave.find({
          companyId,
          employeeId: { $in: teamIds },
          status: { $in: ["pending", "pending_manager"] },
        }).populate("employeeId", "fullName employeeCode"),

        teamMembersList: team,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.projectManagerDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = req.user.employeeId;

    const projects = await Project.find({
      companyId,
      projectManager: employeeId,
    });

    const projectIds = projects.map((item) => item._id);

    res.json({
      success: true,
      dashboard: {
        projects: {
          total: projects.length,
          active: await Project.countDocuments({
            companyId,
            projectManager: employeeId,
            status: { $in: ["active", "in_progress"] },
          }),
          completed: await Project.countDocuments({
            companyId,
            projectManager: employeeId,
            status: { $in: ["completed", "closed"] },
          }),
          delayed: await Project.countDocuments({
            companyId,
            projectManager: employeeId,
            dueDate: { $lt: new Date() },
            status: { $nin: ["completed", "closed"] },
          }),
        },

        tasks: {
          total: await Task.countDocuments({
            companyId,
            projectId: { $in: projectIds },
          }),
          completed: await Task.countDocuments({
            companyId,
            projectId: { $in: projectIds },
            status: { $in: ["completed", "closed"] },
          }),
          pending: await Task.countDocuments({
            companyId,
            projectId: { $in: projectIds },
            status: { $nin: ["completed", "closed"] },
          }),
          overdue: await Task.countDocuments({
            companyId,
            projectId: { $in: projectIds },
            dueDate: { $lt: new Date() },
            status: { $nin: ["completed", "closed"] },
          }),
        },

        projectList: projects,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.employeeDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = req.user.employeeId;
    const attendanceDate = getISTDateString();

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID missing in token",
      });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      dashboard: {
        profile: {
          employeeId: employee.employeeCode,
          name: employee.fullName,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
          status: employee.status,
          department: employee.departmentId || employee.department,
          designation: employee.designationId || employee.designation,
        },

        attendance: {
          today: await Attendance.findOne({
            companyId,
            employeeId,
            attendanceDate,
          }),
          presentDays: await Attendance.countDocuments({
            companyId,
            employeeId,
            status: "present",
          }),
          absentDays: await Attendance.countDocuments({
            companyId,
            employeeId,
            status: "absent",
          }),
          lateDays: await Attendance.countDocuments({
            companyId,
            employeeId,
            status: "late",
          }),
        },

        leave: {
          leaveBalance: employee.leaveBalance || 0,
          totalLeaves: await Leave.countDocuments({ companyId, employeeId }),
          approvedLeaves: await Leave.countDocuments({
            companyId,
            employeeId,
            status: "approved",
          }),
          pendingLeaves: await Leave.countDocuments({
            companyId,
            employeeId,
            status: { $in: ["pending", "pending_manager", "pending_hr"] },
          }),
        },

        tasks: {
          assigned: await Task.countDocuments({ companyId, assignedTo: employeeId }),
          completed: await Task.countDocuments({
            companyId,
            assignedTo: employeeId,
            status: { $in: ["completed", "closed"] },
          }),
          pending: await Task.countDocuments({
            companyId,
            assignedTo: employeeId,
            status: { $nin: ["completed", "closed"] },
          }),
          recent: await Task.find({ companyId, assignedTo: employeeId })
            .sort({ createdAt: -1 })
            .limit(5),
        },

        payroll: {
          latestPayslip: await Payroll.findOne({
            companyId,
            employeeId,
          }).sort({ year: -1, month: -1 }),
        },

        documents: {
          total: await Document.countDocuments({ companyId, employeeId }),
          pending: await Document.countDocuments({
            companyId,
            employeeId,
            status: "uploaded",
          }),
          verified: await Document.countDocuments({
            companyId,
            employeeId,
            status: "verified",
          }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};