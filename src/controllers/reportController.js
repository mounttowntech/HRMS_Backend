const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");

const { percentage, getISTMonthRange } = require("../utils/dashboardutils");

exports.getReportsSummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { start, end } = getISTMonthRange();

    const totalEmployees = await Employee.countDocuments({ companyId });

    const activeEmployees = await Employee.countDocuments({
      companyId,
      status: "active",
    });

    const onboardingEmployees = await Employee.countDocuments({
      companyId,
      status: "onboarding",
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

    const newJoiners = await Employee.countDocuments({
      companyId,
      joiningDate: { $gte: start, $lte: end },
    });

    const resignations = await Employee.countDocuments({
      companyId,
      status: "resigned",
    });

    const employeesByDepartment = await Employee.aggregate([
      { $match: { companyId } },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$department.name",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ["$_id", "Others"] },
          count: 1,
        },
      },
    ]);

    const latestPayroll = await Payroll.findOne({ companyId })
      .sort({ createdAt: -1 })
      .lean();

    const payrollCost = latestPayroll?.netPayroll || 0;
    const averageSalary =
      latestPayroll?.totalEmployees > 0
        ? Number((latestPayroll.netPayroll / latestPayroll.totalEmployees).toFixed(2))
        : 0;

    const employeePayrolls = latestPayroll?.employees || [];

    const highestSalary = employeePayrolls.length
      ? Math.max(...employeePayrolls.map((emp) => emp.netSalary || 0))
      : 0;

    const lowestSalary = employeePayrolls.length
      ? Math.min(...employeePayrolls.map((emp) => emp.netSalary || 0))
      : 0;

    const summaryByDepartment = employeesByDepartment.map((item) => ({
      department: item.department,
      totalEmployees: item.count,
      present,
      onLeave,
      absent,
      newJoiners,
      resignations,
      avgAttendance: `${percentage(present, totalEmployees)}%`,
    }));

    const casualLeave = await Leave.countDocuments({
      companyId,
      leaveType: "casual",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    const sickLeave = await Leave.countDocuments({
      companyId,
      leaveType: "sick",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    res.status(200).json({
      success: true,
      data: {
        monthRange: { start, end },

        overview: {
          presentToday: {
            count: present,
            percentage: percentage(present, totalEmployees),
          },
          onLeaveToday: {
            count: onLeave,
            percentage: percentage(onLeave, totalEmployees),
          },
          newJoiners: {
            count: newJoiners,
            percentage: percentage(newJoiners, totalEmployees),
          },
          resignations: {
            count: resignations,
            percentage: percentage(resignations, totalEmployees),
          },
        },

        employeesByDepartment,

        employee: {
          activeEmployees,
          newJoiners,
          resignations,

          employeeCount: employeesByDepartment,

          employeeStatus: {
            active: activeEmployees,
            onboarding: onboardingEmployees,
          },

          experienceLevel: {
            junior: 0,
            midLevel: 0,
            senior: 0,
          },

          employeeSummaryByDepartment: summaryByDepartment,
        },

        attendance: {
          presentDays: present,
          absentDays: absent,
          lateDays: late,

          attendanceReport: {
            present,
            absent,
            late,
          },

          departmentAttendance: employeesByDepartment,

          weeklyAttendance: {
            mon: 95,
            tue: 93,
            wed: 96,
            thu: 92,
            fri: 94,
          },

          attendanceSummaryByDepartment: summaryByDepartment,
        },

        leave: {
          totalLeave: onLeave,
          casualLeave,
          sickLeave,

          leaveTypeReport: {
            casual: casualLeave,
            sick: sickLeave,
            earned: await Leave.countDocuments({
              companyId,
              leaveType: "earned",
              fromDate: { $lte: end },
              toDate: { $gte: start },
            }),
            permission: await Leave.countDocuments({
              companyId,
              leaveType: "permission",
              fromDate: { $lte: end },
              toDate: { $gte: start },
            }),
          },

          monthlyLeave: {
            jan: 0,
            feb: 0,
            mar: 0,
            apr: 0,
            may: 0,
          },

          departmentLeave: employeesByDepartment,
          leaveSummaryByDepartment: summaryByDepartment,
        },

        payroll: {
          payrollCost,
          averageSalary,
          highestSalary,
          lowestSalary,

          payrollByDepartment: employeesByDepartment,

          salaryRange: {
            "8k-30k": employeePayrolls.filter(
              (emp) => emp.netSalary >= 8000 && emp.netSalary <= 30000
            ).length,
            "30k-50k": employeePayrolls.filter(
              (emp) => emp.netSalary > 30000 && emp.netSalary <= 50000
            ).length,
            "50k-80k": employeePayrolls.filter(
              (emp) => emp.netSalary > 50000 && emp.netSalary <= 80000
            ).length,
            "80k+": employeePayrolls.filter((emp) => emp.netSalary > 80000).length,
          },

          payrollSummary: {
            allowance: 0,
            deductions: latestPayroll?.totalDeductions || 0,
            net: latestPayroll?.netPayroll || 0,
          },

          payrollSummaryByDepartment: summaryByDepartment,
        },

        recruitment: {
          openings: await JobPost.countDocuments({
            companyId,
            status: "open",
          }),
          candidates: await Candidate.countDocuments({ companyId }),
          offerAccepted: await Candidate.countDocuments({
            companyId,
            status: "selected",
          }),
          offerRejected: await Candidate.countDocuments({
            companyId,
            status: "rejected",
          }),

          recruitmentFunnel: {
            applied: await Candidate.countDocuments({
              companyId,
              status: "applied",
            }),
            screening: await Candidate.countDocuments({
              companyId,
              status: "resume_screening",
            }),
            interview: await Candidate.countDocuments({
              companyId,
              status: { $in: ["interview", "hr_interview", "technical_round"] },
            }),
            hired: await Candidate.countDocuments({
              companyId,
              status: "selected",
            }),
          },

          hiringByDepartment: employeesByDepartment,
          recruitmentSummaryByDepartment: summaryByDepartment,
        },

        performance: {
          topPerformers: 0,
          improvementPlan: 0,

          departmentPerformance: employeesByDepartment,

          goalCompletion: {
            completed: 0,
            inProgress: 0,
            pending: 0,
          },

          performanceSummaryByDepartment: summaryByDepartment,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Reports summary failed",
      error: error.message,
    });
  }
};