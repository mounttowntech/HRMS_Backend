const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Task = require("../models/Task");
const Announcement = require("../models/announcementsModel");
const Onboarding = require("../models/Onboarding");
const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");
const Project = require("../models/Project");
const Payroll = require("../models/Payroll");
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

const recentEmployees = await Employee.find({
  companyId,
  status: "active",
})
  .select(
    "fullName email phone employeeCode departmentId designationId joiningDate profileImage shiftId status"
  )
  .populate("departmentId", "departmentName name")
  .populate("designationId", "designationName name")
  .populate("shiftId", "shiftName name")
  .sort({ createdAt: -1 }) // latest employees first
  .limit(5)
  .lean();

    const presentToday = await Attendance.countDocuments({
      companyId,
      date: { $gte: start, $lte: end },
      status: "present",
    });

    const totalLeaves = await Leave.countDocuments({
      companyId,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    const absentTodayRaw =
      totalEmployees - presentToday - totalLeaves;

    const absentToday =
      absentTodayRaw < 0 ? 0 : absentTodayRaw;

    const latestPayroll = await Payroll.findOne({
      companyId,
    })
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    const pendingLeaveRequests = await Leave.countDocuments({
      companyId,
      status: {
        $in: ["pending", "pending_manager", "pending_hr"],
      },
    });

    const onboardingApprovals = await Onboarding.countDocuments({
      companyId,
      status: {
        $in: ["pending", "hr_verification", "admin_access"],
      },
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
      status: {
        $in: ["interview", "hr_interview", "technical_round"],
      },
    });

    res.status(200).json({
      success: true,
      data: {
        monthRange: {
          start,
          end,
        },

        dashboardCards: {
          totalEmployees: {
            count: totalEmployees,
            label: "Active Employees",
          },

          presentToday: {
            count: presentToday,
            label: "Present Today",
          },

          totalLeaves: {
            count: totalLeaves,
            label: "This Month",
          },

          absentToday: {
            count: absentToday,
            label: "Absent Today",
          },

          netPayroll: {
            amount: latestPayroll?.netPayroll || 0,
            label: "This Month",
          },
        },

        attendanceOverview: {
          present: {
            count: presentToday,
            percentage: percentage(
              presentToday,
              totalEmployees
            ),
          },

          onLeave: {
            count: totalLeaves,
            percentage: percentage(
              totalLeaves,
              totalEmployees
            ),
          },

          absent: {
            count: absentToday,
            percentage: percentage(
              absentToday,
              totalEmployees
            ),
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

        recentEmployees: recentEmployees.map((emp) => ({
          fullName: emp.fullName,
          email: emp.email,
          contactNumber: emp.phone,
          employeeCode: emp.employeeCode,
          department: emp.departmentId?.name || "N/A",
          designation: emp.designationId?.name || "N/A",
          shift: emp.shiftId?.shiftName || "N/A",
          joiningDate: emp.joiningDate,
          profileImage: emp.profileImage,
          status: emp.status,
        })),
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

    //get new joiners in the current month
    const newJoiners = await Employee.countDocuments({
      companyId,
      status: "active",
      joiningDate: { $gte: start, $lte: end },
    });

    //get leave requests in the current month
    const leaveRequests = await Leave.countDocuments({
      companyId,
      status: "pending",
      fromDate: { $gte: start, $lte: end },
    });

    //get job open positions status base open
    const openPositions = await JobPost.countDocuments({
      companyId,
      status: "open",
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
        dashboardCard: {
          totalEmployees,
          present,
          newJoiners,
          leaveRequests,
          openPositions,
        },
        attendanceOverview: {
          present,
          absent,
          late,
          attendancePercentage: percentage(present, totalEmployees),
          totalEmployees,
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

      //find projects assigned to team lead
      const projects = await Project.find({
        companyId,
        teamlead: teamLeadId
      }).lean().populate("teamMembers", "fullName employeeCode status").populate("assignedBy", "fullName").populate("projectmanager", "fullName");

      //get team members assigned pending tasks
      const teamMemberIds = projects.flatMap(project => project.teamMembers.map(member =>  member._id));
      const pendingTasks = await Task.find({
        companyId,
        assignedTo: { $in: teamMemberIds },
        status: { $in: ["pending", "in_progress"] }
      }).lean();

      //get leave requests from team members
      const leaveRequests = await Leave.find({
        companyId,
        employeeId: { $in: teamMemberIds },
        status: "pending"
      }).lean();


      const teamMembersData = await Employee.find({
      companyId,
      _id: { $in: teamMemberIds },
      role: "employee",
    })
      .populate("departmentId", "name")
      .select("fullName employeeCode departmentId status")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        dashboardCard: {
          //exclude team lead from team members count
          teamMembers: teamMembersData ? teamMembersData.length : 0,
          PendingTasks: pendingTasks.length || 0,
          leaveRequests: leaveRequests.length || 0,
        },
        teamMembers: teamMembersData ? teamMembersData.map((member) => ({
          fullName: member.fullName,
          employeeCode: member.employeeCode,
          department: member.departmentId?.name || "N/A",
          status: member.status,
        })) : [],
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
      projectmanager: managerId,
    }).lean();
    const projectIds = projects.map((item) => item._id);

    const tasks = await Task.find({
      companyId,
      projectId: { $in: projectIds },
    }).lean().populate("projectId", "projectName").populate("assignedTo", "fullName");
    const tasksInProgress = await tasks.filter((task) => task.status === "in_progress").length;

    const tasksCompleted = await tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const teamMembers = await Employee.countDocuments({
      companyId,
      projectManager: managerId,
    });

    const recentTasks = [...tasks]
  .sort(
    (a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
  )
  .slice(0, 5);

  const recentActivities = recentTasks.map((task) => ({
  _id: task._id,
  taskName: task.taskName,
  status: task.status === "completed" ? "Task Completed" : task.status === "assigned" ? "Task Assigned" : task.status === "in_progress" ? "Task In Progress" : "Task Updated",
  project: task?.projectId?.projectName || "N/A",
user: task.assignedTo ? task.assignedTo.fullName || "N/A" : "N/A",
  updatedAt: task.updatedAt,
}));
    res.status(200).json({
      success: true,
      data: {
        dashboardCard: {
          activeProjects: projects.length || 0,
          teamMembers,
          tasksInProgress,
          tasksCompleted,
          overdueTasks: tasks.filter((task) => task.dueDate < new Date() && task.status !== "completed").length || 0,
        },

        projectProgress: projects.map((project) => ({
          name: project.projectName || project.name,
          percentage: project.progress || 0,
        })),

        recentActivities,

        myProjects: projects.map((project) => ({
          projectName: project.projectName || project.name,
          teamCount: project.teamMembers?.length || 0,
          progress: project.progress || 0,
          deadline: project.dueDate,
          status: project.status || "on track"
        })),

        upcomingDeadlines: projects.map((project) => ({
          projectName: project.projectName || project.name,
          deadline: project.dueDate,
          date: project.dueDate,
          desc: project.description || "",
        })),
      },
    });
  } catch (error) {
    console.error("Error in getProjectManagerDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Project manager dashboard failed",
      error: error.message,
    });
  }
};