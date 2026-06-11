const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Task = require("../models/Task");
const Announcement = require("../models/announcementsModel");
const Onboarding = require("../models/Onboarding");
const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");
const Project = require("../models/Project");

const {
  percentage,
  getISTMonthRange,
} = require("../utils/dashboardutils");
/* ================= ADMIN DASHBOARD ================= */

exports.getAdminDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { start, end } = getISTMonthRange();

    const totalEmployees = await Employee.countDocuments({
      companyId,
      status: "active",
    });

    const present = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      status: "present",
    });

    const absent = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      status: "absent",
    });

    const late = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      isLate: true,
    });

    const onLeave = await Leave.countDocuments({
      companyId,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    const pendingLeaveRequests = await Leave.countDocuments({
      companyId,
      status: "pending",
    });

    const onboardingApprovals = await Onboarding.countDocuments({
      companyId,
      status: { $in: ["pending", "hr_verification", "admin_access"] },
    });

    const openPositions = await JobPost.countDocuments({
      companyId,
      status: "open",
    });

    const newApplicants = await Candidate.countDocuments({
      companyId,
      status: "applied",
    });

    const interviewsScheduled = await Candidate.countDocuments({
      companyId,
      status: { $in: ["interview", "hr_interview", "technical_round"] },
    });

    res.status(200).json({
      success: true,
      data: {
        monthRange: { start, end },

        attendanceOverview: {
          present: {
            count: present,
            percentage: percentage(present, totalEmployees),
          },
          onLeave: {
            count: onLeave,
            percentage: percentage(onLeave, totalEmployees),
          },
          absent: {
            count: absent,
            percentage: percentage(absent, totalEmployees),
          },
          late: {
            count: late,
            percentage: percentage(late, totalEmployees),
          },
        },

        pendingApprovals: {
          leaveRequests: pendingLeaveRequests,
          onboardingApprovals,
        },

        recruitmentDashboard: {
          openPositions,
          newApplicants,
          interviewsScheduled,
        },

        talentPipeline: {
          applied: newApplicants,
          screening: await Candidate.countDocuments({
            companyId,
            status: "resume_screening",
          }),
          interview: interviewsScheduled,
          hired: await Candidate.countDocuments({
            companyId,
            status: "selected",
          }),
        },

        recentHiringUpdates: [
          "3 positions moved to the interview stage this week.",
          "5 candidates completed assessment tests.",
          "2 offers accepted for software engineering roles.",
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin dashboard failed",
      error: error.message,
    });
  }
};

/* ================= HR DASHBOARD ================= */

exports.getHRDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { start, end } = getISTMonthRange();

    const totalEmployees = await Employee.countDocuments({
      companyId,
      status: "active",
    });

    const present = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      status: "present",
    });

    const absent = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      status: "absent",
    });

    const late = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      isLate: true,
    });

    res.status(200).json({
      success: true,
      data: {
        monthRange: { start, end },

        attendanceOverview: {
          present,
          absent,
          late,
          attendancePercentage: percentage(present, totalEmployees),
        },

        onboardingProgress: {
          documentation: 0,
          hrRound: 0,
          technicalRound: 0,
          offerSent: 0,
          joined: 0,
          overallProgress: 80,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "HR dashboard failed",
      error: error.message,
    });
  }
};

/* ================= EMPLOYEE DASHBOARD ================= */

exports.getEmployeeDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const employeeId = req.user.employeeId;

    const { start, end } = getISTMonthRange();

    const presentDays = await Attendance.countDocuments({
      companyId,
      employeeId,
      date: { $gte: start, $lte: end },
      status: "present",
    });

    const absentDays = await Attendance.countDocuments({
      companyId,
      employeeId,
      date: { $gte: start, $lte: end },
      status: "absent",
    });

    const lateEntries = await Attendance.countDocuments({
      companyId,
      employeeId,
      date: { $gte: start, $lte: end },
      isLate: true,
    });

    const workFromHome = await Attendance.countDocuments({
      companyId,
      employeeId,
      date: { $gte: start, $lte: end },
      workMode: "wfh",
    });

    const pendingTasks = await Task.countDocuments({
      companyId,
      assignedTo: employeeId,
      status: { $in: ["pending", "in_progress"] },
    });

    const completedTasks = await Task.countDocuments({
      companyId,
      assignedTo: employeeId,
      status: "completed",
    });

    const leaveRequests = await Leave.countDocuments({
      companyId,
      employeeId,
      status: "pending",
    });

    const tasks = await Task.find({
      companyId,
      assignedTo: employeeId,
    })
      .sort({ dueDate: 1 })
      .limit(6)
      .lean();

    const announcements = await Announcement.find({
      companyId,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        monthRange: { start, end },

        dashboardCard: {
          presentDays,
          leaveBalance: 0,
          pendingTasks,
          completedTasks,
          leaveRequests,
        },

        myAttendance: {
          presentDays: {
            count: presentDays,
            percentage: percentage(presentDays, 30),
          },
          absentDays: {
            count: absentDays,
            percentage: percentage(absentDays, 30),
          },
          lateEntries: {
            count: lateEntries,
            percentage: percentage(lateEntries, 30),
          },
          workFromHome: {
            count: workFromHome,
            percentage: percentage(workFromHome, 30),
          },
        },

        upcomingHolidays: [],

        myTasks: tasks.map((task) => ({
          name: task.title || task.taskName,
          level: task.priority || "medium",
          date: task.dueDate,
          completed: task.status === "completed",
        })),

        announcements: announcements.map((item) => ({
          title: item.title,
          description: item.description,
          date: item.createdAt,
        })),

        quickActions: [
          {
            name: "Apply Leave",
            path: "/employee/leave",
          },
          {
            name: "My Attendance",
            path: "/employee/attendance",
          },
          {
            name: "My Tasks",
            path: "/employee/tasks",
          },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Employee dashboard failed",
      error: error.message,
    });
  }
};

/* ================= TEAM LEAD DASHBOARD ================= */

exports.getTeamLeadDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const teamLeadId = req.user.employeeId;

    const members = await Employee.find({
      companyId,
      reportingManager: teamLeadId,
    })
      .populate("departmentId", "name")
      .select("fullName employeeCode departmentId status")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        dashboardCard: {
          teamMembers: members.length,
        },

        teamMembers: members.map((emp) => ({
          name: emp.fullName,
          ID: emp.employeeCode,
          department: emp.departmentId?.name || "",
          status: emp.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Teamlead dashboard failed",
      error: error.message,
    });
  }
};

/* ================= PROJECT MANAGER DASHBOARD ================= */

exports.getProjectManagerDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const managerId = req.user.employeeId;

    const projects = await Project.find({
      companyId,
      projectManager: managerId,
    }).lean();

    const projectIds = projects.map((item) => item._id);

    const tasksInProgress = await Task.countDocuments({
      companyId,
      projectId: { $in: projectIds },
      status: "in_progress",
    });

    const teamMembers = await Employee.countDocuments({
      companyId,
      projectManager: managerId,
    });

    res.status(200).json({
      success: true,
      data: {
        dashboardCard: {
          teamMembers,
          tasksInProgress,
        },

        projectProgress: projects.map((project) => ({
          name: project.projectName || project.name,
          percentage: project.progress || 0,
        })),

        recentActivities: [],

        myProjects: projects.map((project) => ({
          projectName: project.projectName || project.name,
          teamCount: project.teamMembers?.length || 0,
          progress: project.progress || 0,
          deadline: project.deadline,
          status: project.status || "on track",
        })),

        upcomingDeadlines: projects.map((project) => ({
          projectName: project.projectName || project.name,
          deadline: project.deadline,
          date: project.deadline,
          desc: project.description || "",
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Project manager dashboard failed",
      error: error.message,
    });
  }
};