const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");
const mongoose = require("mongoose");
const Department = require("../models/departmentModel");
const Task = require("../models/Task");

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
console.log("employeesByDepartment:",employeesByDepartment)
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
// console.log("companyId:",companyId)
//     //get employee count by department get department name and count
    const employeeCountByDepartment = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: "active",
        },
      },
      {
        $group: {
          _id: "$departmentId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
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
        $project: {
          _id: 0,
          departmentId: "$_id",
          departmentName: {
            $ifNull: ["$department.name", "No Department"],
          },
          count: 1,
        },
      },
    ]);
    // console.log("employeeCountByDepartment:",employeeCountByDepartment)

    const summaryByDepartmentData = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
        },
      },

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
        $lookup: {
          from: "attendances",
          let: {
            empId: "$_id",
            companyId: "$companyId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employeeId", "$$empId"] },
                    { $eq: ["$companyId", "$$companyId"] },
                    { $gte: ["$date", start] },
                    { $lte: ["$date", end] },
                  ],
                },
              },
            },
          ],
          as: "attendance",
        },
      },

      {
        $group: {
          _id: "$departmentId",

          department: {
            $first: {
              $ifNull: ["$department.name", "Others"],
            },
          },

          totalEmployees: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },

          newJoiners: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$joiningDate", start] },
                    { $lte: ["$joiningDate", end] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          resignations: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$relievingDate", null] },
                    { $gte: ["$relievingDate", start] },
                    { $lte: ["$relievingDate", end] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          present: {
            $sum: {
              $size: {
                $filter: {
                  input: "$attendance",
                  as: "att",
                  cond: { $eq: ["$$att.status", "present"] },
                },
              },
            },
          },

          onLeave: {
            $sum: {
              $size: {
                $filter: {
                  input: "$attendance",
                  as: "att",
                  cond: { $eq: ["$$att.status", "on_leave"] },
                },
              },
            },
          },

          absent: {
            $sum: {
              $size: {
                $filter: {
                  input: "$attendance",
                  as: "att",
                  cond: { $eq: ["$$att.status", "absent"] },
                },
              },
            },
          },
        },
      },

      {
        $addFields: {
          avgAttendance: {
            $cond: [
              {
                $gt: [
                  { $add: ["$present", "$onLeave", "$absent"] },
                  0,
                ],
              },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$present",
                          { $add: ["$present", "$onLeave", "$absent"] },
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },

      {
        $project: {
          _id: 0,
          departmentId: "$_id",
          department: 1,
          totalEmployees: 1,
          present: 1,
          onLeave: 1,
          absent: 1,
          newJoiners: 1,
          resignations: 1,
          avgAttendance: 1,
        },
      },

      {
        $sort: {
          department: 1,
        },
      },
    ]);
    // console.log("summaryByDepartmentData:",summaryByDepartmentData);

    const weeklyAttendance = await Attendance.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            $dayOfWeek: "$date",
          },
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0], 
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id",
          attendancePercentage: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ["$present", "$total"],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);
    console.log("weeklyAttendance:",weeklyAttendance)
    const weeklyAttendanceData = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
    };
    
    weeklyAttendance.forEach((item) => {
      switch (item.day) {
        case 1:
          weeklyAttendanceData.sun = item.attendancePercentage;
          break;
        case 2:
          weeklyAttendanceData.mon = item.attendancePercentage;
          break;
        case 3:
          weeklyAttendanceData.tue = item.attendancePercentage;
          break;
        case 4:
          weeklyAttendanceData.wed = item.attendancePercentage;
          break;
        case 5:
          weeklyAttendanceData.thu = item.attendancePercentage;
          break;
        case 6:
          weeklyAttendanceData.fri = item.attendancePercentage;
          break;
        case 7:
          weeklyAttendanceData.sat = item.attendancePercentage;
          break;
      }
    });
    
    console.log("weeklyAttendanceData:",weeklyAttendanceData);

      //get payroll data by department
      const payrollSummaryByDepartment = await Payroll.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            month : new Date().getMonth() + 1,
            year : new Date().getFullYear(),
          },
        },
      
        { $unwind: "$employees" },
      
        {
          $lookup: {
            from: "employees",
            localField: "employees.employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
      
        {
          $lookup: {
            from: "departments",
            localField: "employee.departmentId",
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
            _id: "$employee.departmentId",
      
            department: {
              $first: {
                $ifNull: ["$department.name", "Others"],
              },
            },
      
            totalEmployees: { $sum: 1 },
            totalEarnings: { $sum: "$employees.grossEarning" },
            totalDeductions: { $sum: "$employees.totalDeduction" },
            totalNetPayroll: { $sum: "$employees.netSalary" },
          },
        },
      
        {
          $project: {
            _id: 0,
            departmentId: "$_id",
            department: 1,
            totalEmployees: 1,
            totalEarnings: 1,
            totalDeductions: 1,
            totalNetPayroll: 1,
          },
        },
      
        { $sort: { department: 1 } },
      ]);
    console.log("payrollSummaryByDepartment:",payrollSummaryByDepartment);

    //get hiring count by department
    const hiringCountByDepartment = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          joiningDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
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
          _id: "$departmentId",
          department: {
            $first: {
              $ifNull: ["$department.name", "Others"],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          department: 1,
          count: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);
    
    console.log("hiringCountByDepartment:",hiringCountByDepartment);

    //get employee leave count by department
    const employeeLeaveCountByDepartment = await Department.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
        },
      },
    
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "departmentId",
          as: "employees",
        },
      },
    
      {
        $lookup: {
          from: "leaves",
          let: {
            employeeIds: "$employees._id",
          },
          pipeline: [
            {
              $match: {
                companyId: new mongoose.Types.ObjectId(companyId),
                $expr: {
                  $in: ["$employeeId", "$$employeeIds"],
                },
              },
            },
            // Optional
            // { $match: { status: "approved" } }
          ],
          as: "leaves",
        },
      },
    
      {
        $project: {
          _id: 0,
          department: "$name",
          leaveCount: {
            $size: "$leaves",
          },
        },
      },
    
      {
        $sort: {
          department: 1,
        },
      },
    ]);
    
    // console.log("employeeLeaveCountByDepartment:",employeeLeaveCountByDepartment);

    const performanceCountByDepartment = await Department.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
        },
      },
    
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "departmentId",
          as: "employees",
        },
      },
    
      {
        $lookup: {
          from: "tasks",
          let: {
            employeeIds: "$employees._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$assignedTo", "$$employeeIds"],
                },
              },
            },
          ],
          as: "tasks",
        },
      },
    
      {
        $addFields: {
          totalEmployees: {
            $size: "$employees",
          },
    
          totalTasks: {
            $size: "$tasks",
          },
    
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: {
                  $eq: ["$$task.status", "completed"],
                },
              },
            },
          },
        },
      },
    
      {
        $project: {
          _id: 0,
          departmentId: "$_id",
          department: "$name",
          totalEmployees: 1,
          totalTasks: 1,
          completedTasks: 1,
    
          performancePercentage: {
            $cond: [
              { $gt: ["$totalTasks", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$completedTasks",
                          "$totalTasks",
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    
      {
        $sort: {
          performancePercentage: -1,
        },
      },
    ]);
    
    // console.log(performanceCountByDepartment);

    const taskStatusCount = await Task.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    
    // console.log(taskStatusCount);

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
          totalEmployees: {
            count: totalEmployees,
            percentage: percentage(totalEmployees, totalEmployees),
          },
          employeeCountByDepartment: employeeCountByDepartment,
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

          weeklyAttendance: weeklyAttendanceData,

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

          departmentLeave: employeeLeaveCountByDepartment,
          leaveSummaryByDepartment: summaryByDepartment,
        },

        payroll: {
          payrollCost,
          averageSalary,
          highestSalary,
          lowestSalary,

          payrollByDepartment: payrollSummaryByDepartment,

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

          departmentPerformance: performanceCountByDepartment,

          goalCompletion: {
            completed: taskStatusCount.find((item) => item._id === "completed")?.count || 0,
            inProgress: taskStatusCount.find((item) => item._id === "started")?.count || 0,
            pending: taskStatusCount.find((item) => item._id === "assigned")?.count || 0,
          },

          performanceSummaryByDepartment: summaryByDepartment,
        },
        summaryByDepartmentData: summaryByDepartmentData
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