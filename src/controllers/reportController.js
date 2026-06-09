const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const Task = require("../models/Task");
const Project = require("../models/Project");
const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");

const { getISTDateString, percentage } = require("../utils/dateHelper");

const getPayrollSummary = async (companyId) => {
  const data = await Payroll.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: null,
        payrollCost: { $sum: "$netSalary" },
        averageSalary: { $avg: "$netSalary" },
        highestSalary: { $max: "$netSalary" },
        lowestSalary: { $min: "$netSalary" },
        totalEarnings: { $sum: "$grossSalary" },
        totalDeductions: { $sum: "$deductions" },
      },
    },
  ]);

  return (
    data[0] || {
      payrollCost: 0,
      averageSalary: 0,
      highestSalary: 0,
      lowestSalary: 0,
      totalEarnings: 0,
      totalDeductions: 0,
    }
  );
};

exports.summaryReport = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const attendanceDate = getISTDateString();

    const totalEmployees = await Employee.countDocuments({ companyId });
    const activeEmployees = await Employee.countDocuments({
      companyId,
      status: "active",
    });

    const presentToday = await Attendance.countDocuments({
      companyId,
      attendanceDate,
      status: "present",
    });

    const onLeaveToday = await Attendance.countDocuments({
      companyId,
      attendanceDate,
      status: "leave",
    });

    const absentToday = Math.max(activeEmployees - presentToday - onLeaveToday, 0);
    const payroll = await getPayrollSummary(companyId);

    res.json({
      success: true,
      report: {
        overview: {
          presentToday: {
            count: presentToday,
            percentage: percentage(presentToday, activeEmployees),
          },
          onLeaveToday: {
            count: onLeaveToday,
            percentage: percentage(onLeaveToday, activeEmployees),
          },
          newJoiners: {
            count: await Employee.countDocuments({
              companyId,
              status: { $in: ["candidate_selected", "onboarding"] },
            }),
            percentage: percentage(
              await Employee.countDocuments({
                companyId,
                status: { $in: ["candidate_selected", "onboarding"] },
              }),
              totalEmployees
            ),
          },
          resignations: {
            count: await Employee.countDocuments({
              companyId,
              status: "inactive",
            }),
            percentage: percentage(
              await Employee.countDocuments({
                companyId,
                status: "inactive",
              }),
              totalEmployees
            ),
          },
        },

        attendanceOverview: {
          totalEmployees: activeEmployees,
          presentEmployees: presentToday,
          absentEmployees: absentToday,
        },

        leaveOverview: {
          totalLeave: await Leave.countDocuments({ companyId }),
          casual: await Leave.countDocuments({ companyId, leaveType: "casual" }),
          sick: await Leave.countDocuments({ companyId, leaveType: "sick" }),
        },

        employee: {
          activeEmployees,
          newJoiners: await Employee.countDocuments({
            companyId,
            status: { $in: ["candidate_selected", "onboarding"] },
          }),
          resignations: await Employee.countDocuments({
            companyId,
            status: "inactive",
          }),
          employeeStatus: {
            active: activeEmployees,
            onboarding: await Employee.countDocuments({
              companyId,
              status: "onboarding",
            }),
          },
        },

        attendance: {
          presentDays: presentToday,
          absentDays: absentToday,
          lateDays: await Attendance.countDocuments({
            companyId,
            attendanceDate,
            status: "late",
          }),
        },

        leave: {
          totalLeave: await Leave.countDocuments({ companyId }),
          casualLeave: await Leave.countDocuments({ companyId, leaveType: "casual" }),
          sickLeave: await Leave.countDocuments({ companyId, leaveType: "sick" }),
        },

        payroll: {
          payrollCost: payroll.payrollCost,
          averageSalary: Math.round(payroll.averageSalary || 0),
          highestSalary: payroll.highestSalary,
          lowestSalary: payroll.lowestSalary,
          totalEarnings: payroll.totalEarnings,
          totalDeductions: payroll.totalDeductions,
        },

        recruitment: {
          openings: await JobPost.countDocuments({ companyId, status: "open" }),
          candidates: await Candidate.countDocuments({ companyId }),
          offerAccepted: await Candidate.countDocuments({
            companyId,
            status: "selected",
          }),
          offerRejected: await Candidate.countDocuments({
            companyId,
            status: "rejected",
          }),
          funnel: {
            applied: await Candidate.countDocuments({ companyId, status: "applied" }),
            screening: await Candidate.countDocuments({
              companyId,
              status: "resume_screening",
            }),
            interview: await Candidate.countDocuments({
              companyId,
              status: { $in: ["hr_interview", "technical_round"] },
            }),
            hired: await Candidate.countDocuments({
              companyId,
              status: "selected",
            }),
          },
        },

        project: {
          totalProjects: await Project.countDocuments({ companyId }),
          activeProjects: await Project.countDocuments({
            companyId,
            status: { $in: ["active", "in_progress"] },
          }),
          completedProjects: await Project.countDocuments({
            companyId,
            status: { $in: ["completed", "closed"] },
          }),
        },

        tasks: {
          openTasks: await Task.countDocuments({
            companyId,
            status: { $nin: ["closed", "completed"] },
          }),
          closedTasks: await Task.countDocuments({
            companyId,
            status: { $in: ["closed", "completed"] },
          }),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};