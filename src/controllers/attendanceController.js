const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Leave = require("../models/Leave");
const bcrypt = require("bcryptjs");
const PermissionRequest = require("../models/permissionRequest");

const {
  getISTDateString,
  getISTStartOfDay,
  formatISTDateTime,
} = require("../utils/attendanceDate");

const {
  minutesDiff,
  calculateAttendance,
  calculateLateMinutes,
} = require("../utils/attendanceCalculator");

const {
  getAttendanceDateByShift,
} = require("../utils/shiftAttendanceDate");
// ======================================================
// DATE HELPERS
// ======================================================

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ======================================================
// DATE KEY HELPER - INDIA LOCAL DATE FORMAT
// ======================================================
const getDateKey = (date) => {
  const d = new Date(date);

  return d.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};
// const minutesDiff = (start, end) => {
//   return Math.floor((new Date(end) - new Date(start)) / 60000);
// };

const getActiveAttendance = async (companyId, employeeId) => {
  return await Attendance.findOne({
    companyId,
    employeeId,
    punchIn: { $ne: null },
    punchOut: null,
  }).sort({ punchIn: -1 });
};

// ======================================================
// CALCULATE ATTENDANCE
// ======================================================

// const calculateAttendance = (attendance) => {
//   const totalBreakMinutes = attendance.breaks.reduce(
//     (sum, b) => sum + (b.minutes || 0),
//     0
//   );

//   attendance.totalBreakMinutes = totalBreakMinutes;

//   if (attendance.punchIn && attendance.punchOut) {
//     const totalMinutes = minutesDiff(
//       attendance.punchIn,
//       attendance.punchOut
//     );

//     attendance.workingMinutes = Math.max(
//       0,
//       totalMinutes - totalBreakMinutes
//     );

//     attendance.status =
//       attendance.workingMinutes < 240
//         ? "half_day"
//         : "present";
//   }

//   return attendance;
// };

// ======================================================
// VERIFY EMPLOYEE PASSWORD
// ======================================================

const verifyEmployeePassword = async (
  companyId,
  employeeCode,
  password
) => {
  try {
    console.log("================================");
    console.log("COMPANY ID:", companyId);
    console.log("EMPLOYEE CODE:", employeeCode);
    console.log("PASSWORD:", password);

    // ========================================
    // FIND EMPLOYEE
    // ========================================

    const employee = await Employee.findOne({
      companyId,
      employeeCode,
    });

    console.log("EMPLOYEE:", employee);

    if (!employee) {
      console.log("❌ Employee not found");
      return null;
    }

    // ========================================
    // FIND USER
    // ========================================

    const user = await User.findOne({
      employeeId: employee._id,
    }).select("+password");

    console.log("USER:", user);

    if (!user) {
      console.log("❌ User not found");
      return null;
    }

    // ========================================
    // CHECK PASSWORD EXISTS
    // ========================================

    if (!user.password) {
      console.log("❌ Password missing");
      return null;
    }

    console.log("DB PASSWORD:", user.password);

    // ========================================
    // COMPARE PASSWORD
    // ========================================

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("❌ Invalid password");
      return null;
    }

    console.log("✅ LOGIN SUCCESS");

    return employee;
  } catch (error) {
    console.log("VERIFY ERROR:", error);
    return null;
  }
};




const getUserId = (req) => req.user?.userId || req.user?.id;

const getShiftName = (employee) => {
  return (
    employee.shiftId?.shiftName ||
    employee.shiftId?.name ||
    employee.shiftType ||
    "Day Shift"
  );
};

const formatTime = (date) => {
  if (!date) return null;

  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getDateRange = (date) => {
  const start = new Date(`${date}T00:00:00+05:30`);
  const end = new Date(`${date}T23:59:59.999+05:30`);
  return { start, end };
};

const getMonthRange = (month, year) => {
  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+05:30`
  );

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);

  return { start, end };
};

const calculateBreakDetails = (attendance) => {
  const actualBreakMinutes =
    attendance?.breaks?.reduce((sum, item) => {
      if (item.minutes) return sum + item.minutes;

      if (item.breakIn && item.breakOut) {
        return sum + minutesDiff(item.breakIn, item.breakOut);
      }

      return sum;
    }, 0) || 0;

  return {
    allowedBreakMinutes: 60,
    actualBreakMinutes,
    extraBreakMinutes:
      actualBreakMinutes > 60 ? actualBreakMinutes - 60 : 0,
  };
};

const roundAmount = (amount) => {
  return Number((amount || 0).toFixed(2));
};

exports.employeePunchIn = async (req, res) => {
  try {
    const userId = getUserId(req);

    const employee = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
      status: "active",
    }).populate("shiftId", "shiftName name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const shiftName = getShiftName(employee);
    const attendanceDate = getAttendanceDateByShift(shiftName);

    let attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      attendanceDate,
    });

    if (attendance?.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Already punched in",
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        companyId: req.user.companyId,
        employeeId: employee._id,
        attendanceDate,
        date: new Date(`${attendanceDate}T00:00:00+05:30`),
        shiftName,
        attendanceMode: "employee_login",
      });
    }

    attendance.punchIn = new Date();
    attendance.punchInSource = "employee_login";
    attendance.shiftName = shiftName;
    attendance.status = "present";

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Punch in successful",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.employeePunchOut = async (req, res) => {
//   try {
//     const userId = getUserId(req);

//     const employee = await Employee.findOne({
//       userId,
//       companyId: req.user.companyId,
//     }).populate("shiftId", "shiftName name");

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const shiftName = getShiftName(employee);
//     const attendanceDate = getAttendanceDateByShift(shiftName);

//     const attendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId: employee._id,
//       attendanceDate,
//     });

//     if (!attendance || !attendance.punchIn) {
//       return res.status(400).json({
//         success: false,
//         message: "Punch in first",
//       });
//     }

//     if (attendance.punchOut) {
//       return res.status(400).json({
//         success: false,
//         message: "Already punched out",
//       });
//     }

//     const activeBreak = attendance.breaks[attendance.breaks.length - 1];

//     if (activeBreak && !activeBreak.breakOut) {
//       activeBreak.breakOut = new Date();
//       activeBreak.minutes = 60;
//       activeBreak.source = "auto_closed_default_60_min";
//     }

//     attendance.punchOut = new Date();
//     attendance.punchOutSource = "employee_login";
//     attendance.shiftName = attendance.shiftName || shiftName;

//     calculateAttendance(attendance);

//     attendance.lateMinutes = calculateLateMinutes(
//       attendance.attendanceDate,
//       attendance.punchIn,
//       attendance.shiftName
//     );

//     attendance.isLate = attendance.lateMinutes > 0;

//     await attendance.save();

//     res.status(200).json({
//       success: true,
//       message: "Punch out successful",
//       attendance,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.employeePunchOut = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const employee = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    }).populate("shiftId", "shiftName name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const shiftName =
      employee.shiftId?.shiftName ||
      employee.shiftId?.name ||
      employee.shiftType ||
      "Day Shift";

    // FIRST: find active open attendance
    // This works for day shift and night shift
    let attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      punchIn: { $ne: null },
      punchOut: null,
    }).sort({ punchIn: -1 });

    // SECOND: fallback by shift attendanceDate
    if (!attendance) {
      const attendanceDate = getAttendanceDateByShift(shiftName);

      attendance = await Attendance.findOne({
        companyId: req.user.companyId,
        employeeId: employee._id,
        attendanceDate,
      });
    }

    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Punch in first",
      });
    }

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message: "Already punched out",
      });
    }

    const activeBreak = attendance.breaks?.[attendance.breaks.length - 1];

    if (activeBreak && !activeBreak.breakOut) {
      activeBreak.breakOut = new Date();

      activeBreak.minutes = Math.floor(
        (activeBreak.breakOut - activeBreak.breakIn) / 60000
      );

      activeBreak.source = "auto_closed_on_punchout";
    }

    attendance.shiftName = attendance.shiftName || shiftName;
    attendance.punchOut = new Date();
    attendance.punchOutSource = "employee_login";

    console.log("Calculating attendance for punch out...",attendance);

    calculateAttendance(attendance);

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Punch out successful",
      attendance,
      display: {
        punchIn: formatISTDateTime(attendance?.punchIn),
        punchOut: formatISTDateTime(attendance?.punchOut),
      }
    });
  } catch (error) {
    console.log("PUNCH OUT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.startBreak = async (req, res) => {
//   try {
//     const userId = getUserId(req);

//     const employee = await Employee.findOne({
//       userId,
//       companyId: req.user.companyId,
//     }).populate("shiftId", "shiftName name");

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const shiftName = getShiftName(employee);
//     const attendanceDate = getAttendanceDateByShift(shiftName);

//     const attendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId: employee._id,
//       attendanceDate,
//     });

//     if (!attendance || !attendance.punchIn) {
//       return res.status(400).json({
//         success: false,
//         message: "Punch in first",
//       });
//     }

//     if (attendance.punchOut) {
//       return res.status(400).json({
//         success: false,
//         message: "Already punched out",
//       });
//     }

//     const lastBreak = attendance.breaks[attendance.breaks.length - 1];

//     if (lastBreak && !lastBreak.breakOut) {
//       return res.status(400).json({
//         success: false,
//         message: "Break already started",
//       });
//     }

//     attendance.breaks.push({
//       breakIn: new Date(),
//       source: "employee_login",
//     });

//     await attendance.save();

//     res.status(200).json({
//       success: true,
//       message: "Break started",
//       attendance,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.startBreak = async (req, res) => {
  try {
    const userId = getUserId(req);

    const employee = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    }).populate("shiftId", "shiftName name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const shiftName = getShiftName(employee);

    // 1. Find active attendance first
    let attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      punchIn: { $ne: null },
      punchOut: null,
    }).sort({ punchIn: -1 });

    // 2. Fallback by shift attendance date
    if (!attendance) {
      const attendanceDate = getAttendanceDateByShift(shiftName);

      attendance = await Attendance.findOne({
        companyId: req.user.companyId,
        employeeId: employee._id,
        attendanceDate,
      });
    }

    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Punch in first",
      });
    }

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message: "Already punched out",
      });
    }

    const lastBreak = attendance.breaks?.[attendance.breaks.length - 1];

    if (lastBreak && !lastBreak.breakOut) {
      return res.status(400).json({
        success: false,
        message: "Break already started",
      });
    }

    attendance.breaks.push({
      breakIn: new Date(),
      source: "employee_login",
    });

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Break started",
      attendance,
    });
  } catch (error) {
    console.log("START BREAK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.endBreak = async (req, res) => {
//   try {
//     const userId = getUserId(req);

//     const employee = await Employee.findOne({
//       userId,
//       companyId: req.user.companyId,
//     }).populate("shiftId", "shiftName name");

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const shiftName = getShiftName(employee);
//     const attendanceDate = getAttendanceDateByShift(shiftName);

//     const attendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId: employee._id,
//       attendanceDate,
//     });

//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         message: "Attendance not found",
//       });
//     }

//     const lastBreak = attendance.breaks[attendance.breaks.length - 1];

//     if (!lastBreak || lastBreak.breakOut) {
//       return res.status(400).json({
//         success: false,
//         message: "No active break found",
//       });
//     }

//     lastBreak.breakOut = new Date();
//     lastBreak.minutes = minutesDiff(lastBreak.breakIn, lastBreak.breakOut);

//     calculateAttendance(attendance);

//     await attendance.save();

//     res.status(200).json({
//       success: true,
//       message: "Break ended",
//       attendance,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// DAY-WISE ATTENDANCE REPORT

exports.endBreak = async (req, res) => {
  try {
    const userId = getUserId(req);

    const employee = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    }).populate("shiftId", "shiftName name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const shiftName = getShiftName(employee);

    // 1. Find active attendance first
    let attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      punchIn: { $ne: null },
      punchOut: null,
    }).sort({ punchIn: -1 });

    // 2. Fallback by shift attendance date
    if (!attendance) {
      const attendanceDate = getAttendanceDateByShift(shiftName);

      attendance = await Attendance.findOne({
        companyId: req.user.companyId,
        employeeId: employee._id,
        attendanceDate,
      });
    }

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message: "Already punched out",
      });
    }

    const lastBreak = attendance.breaks?.[attendance.breaks.length - 1];

    if (!lastBreak || lastBreak.breakOut) {
      return res.status(400).json({
        success: false,
        message: "No active break found",
      });
    }

    lastBreak.breakOut = new Date();

    lastBreak.minutes = minutesDiff(
      lastBreak.breakIn,
      lastBreak.breakOut
    );

    calculateAttendance(attendance);

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Break ended",
      attendance,
    });
  } catch (error) {
    console.log("END BREAK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { date, employeeId } = req.query;

    const selectedDate = date || getISTDateString();
    const todayDate = getISTDateString();

    const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);

    if (!isValidDateFormat) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        attendance: [],
      });
    }

    if (selectedDate > todayDate) {
      return res.status(200).json({
        success: true,
        date: selectedDate,
        count: 0,
        summary: {
          totalEmployees: 0,
          working: 0,
          present: 0,
          halfDay: 0,
          leave: 0,
          absent: 0,
          late: 0,
          permission: 0,
          extraBreakTaken: 0,
        },
        attendance: [],
      });
    }

    const { start, end } = getDateRange(selectedDate);

    const employeeFilter = {
      companyId,
      status: "active",
    };

    if (employeeId) {
      employeeFilter._id = employeeId;
    }

    const employees = await Employee.find(employeeFilter)
      .select(
        "fullName employeeCode email salary role departmentId designationId shiftId"
      )
      .populate("departmentId", "name departmentName")
      .populate("designationId", "name designationName")
      .populate("shiftId", "shiftName name")
      .lean();

    if (!employees.length) {
      return res.status(200).json({
        success: true,
        date: selectedDate,
        count: 0,
        summary: {
          totalEmployees: 0,
          working: 0,
          present: 0,
          halfDay: 0,
          leave: 0,
          absent: 0,
          late: 0,
          permission: 0,
          extraBreakTaken: 0,
        },
        attendance: [],
      });
    }

    const attendanceRecords = await Attendance.find({
      companyId,
      date: {
        $gte: start,
        $lte: end,
      },
    }).lean();

    const leaveRecords = await Leave.find({
      companyId,
      status: "approved",
      fromDate: {
        $lte: end,
      },
      toDate: {
        $gte: start,
      },
    }).lean();

    const permissionRecords = await PermissionRequest.find({
      companyId,
      status: "approved",
      permissionDate: {
        $gte: start,
        $lte: end,
      },
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach((item) => {
      attendanceMap[item.employeeId.toString()] = item;
    });

    const leaveMap = {};
    leaveRecords.forEach((item) => {
      leaveMap[item.employeeId.toString()] = item;
    });

    const permissionMap = {};
    permissionRecords.forEach((item) => {
      permissionMap[item.employeeId.toString()] = item;
    });

    const attendance = employees.map((emp) => {
      const empId = emp._id.toString();

      const attendanceData = attendanceMap[empId];
      const leave = leaveMap[empId];
      const permission = permissionMap[empId];

      let status = "absent";

      if (leave) {
        status = "leave";
      } else if (attendanceData?.punchIn && !attendanceData?.punchOut) {
        status = "working";
      } else if (attendanceData?.status) {
        status = attendanceData.status;
      }

      const breakDetails = calculateBreakDetails(attendanceData);

      const lateMinutes = attendanceData?.punchIn
        ? calculateLateMinutes(selectedDate, attendanceData.punchIn)
        : 0;

      return {
        employeeId: emp._id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        email: emp.email,
        role: emp.role,

        department:
          emp.departmentId?.departmentName ||
          emp.departmentId?.name ||
          "",

        designation:
          emp.designationId?.designationName ||
          emp.designationId?.name ||
          "",

        shiftName:
          attendanceData?.shiftName ||
          emp.shiftId?.shiftName ||
          emp.shiftId?.name ||
          "Day Shift",

        date: selectedDate,
        status,

        punchInDateTime: attendanceData?.punchIn || null,
        punchOutDateTime: attendanceData?.punchOut || null,

        checkInTime: formatTime(attendanceData?.punchIn),
        checkOutTime: formatTime(attendanceData?.punchOut),

        workingMinutes: attendanceData?.workingMinutes || 0,
        totalBreakMinutes: attendanceData?.totalBreakMinutes || 0,

        break: breakDetails,

        late: {
          isLate: lateMinutes > 0,
          lateMinutes,
        },

        permission: permission
          ? {
              permissionId: permission._id,
              fromTime: permission.fromTime,
              toTime: permission.toTime,
              minutes: permission.minutes,
              reason: permission.reason,
            }
          : null,

        leave: leave
          ? {
              leaveId: leave._id,
              leaveType: leave.leaveType,
              fromDate: leave.fromDate,
              toDate: leave.toDate,
              reason: leave.reason,
            }
          : null,
      };
    });

    const summary = {
      totalEmployees: attendance.length,
      working: attendance.filter((x) => x.status === "working").length,
      present: attendance.filter((x) => x.status === "present").length,
      halfDay: attendance.filter((x) => x.status === "half_day").length,
      leave: attendance.filter((x) => x.status === "leave").length,
      absent: attendance.filter((x) => x.status === "absent").length,
      late: attendance.filter((x) => x.late.isLate).length,
      permission: attendance.filter((x) => x.permission).length,
      extraBreakTaken: attendance.filter(
        (x) => x.break.extraBreakMinutes > 0
      ).length,
    };

    res.status(200).json({
      success: true,
      date: selectedDate,
      count: 0,
      summary,
      attendance,
    });
  } catch (error) {
    console.log("GET ATTENDANCE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
      attendance: [],
    });
  }
};

// MONTHLY SALARY REPORT
exports.getMonthlyAttendanceSalaryReport = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { month, year, employeeId } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const { start, end } = getMonthRange(Number(month), Number(year));

    const employeeFilter = {
      companyId,
      status: "active",
    };

    if (employeeId) {
      employeeFilter._id = employeeId;
    }

    const employees = await Employee.find(employeeFilter)
      .select("fullName employeeCode email salary role shiftId")
      .populate("shiftId", "shiftName name")
      .lean();

    const report = [];

    for (const emp of employees) {
      const attendanceRecords = await Attendance.find({
        companyId,
        employeeId: emp._id,
        date: { $gte: start, $lte: end },
      }).lean();

      const approvedLeaves = await Leave.countDocuments({
        companyId,
        employeeId: emp._id,
        status: "approved",
        fromDate: { $lte: end },
        toDate: { $gte: start },
      });

      const permissions = await PermissionRequest.find({
        companyId,
        employeeId: emp._id,
        status: "approved",
        permissionDate: { $gte: start, $lte: end },
      }).lean();

      const shiftName = emp.shiftId?.shiftName || emp.shiftId?.name || "Day Shift";

      const isNightShift = shiftName.toLowerCase().includes("night");

      const totalWorkingDays = isNightShift ? 22 : 24;

      const presentDays = attendanceRecords.filter(
        (item) => item.status === "present"
      ).length;

      const halfDays = attendanceRecords.filter(
        (item) => item.status === "half_day"
      ).length;

      const salaryDays = presentDays + halfDays * 0.5;

      const absentDays = Math.max(
        0,
        totalWorkingDays - salaryDays - approvedLeaves
      );

      let totalLateMinutes = 0;
      let totalExtraBreakMinutes = 0;
      let totalPermissionMinutes = 0;

      attendanceRecords.forEach((item) => {
        totalLateMinutes += calculateLateMinutes(
          item.attendanceDate,
          item.punchIn
        );

        const breakDetails = calculateBreakDetails(item);
        totalExtraBreakMinutes += breakDetails.extraBreakMinutes;
      });

      permissions.forEach((item) => {
        totalPermissionMinutes += item.minutes || 0;
      });

      const monthlySalary = Number(emp.salary || 0);
      const perDaySalary = monthlySalary / totalWorkingDays;
      const perMinuteSalary = perDaySalary / 8 / 60;

      const extraBreakDeduction = perMinuteSalary * totalExtraBreakMinutes;

      let grossSalary = perDaySalary * salaryDays;
      grossSalary = grossSalary - extraBreakDeduction;

      const basicSalary = isNightShift ? grossSalary * 0.4 : grossSalary * 0.5;

      const pfDeduction = basicSalary * 0.12;
      const esiDeduction = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;

      const totalDeduction = pfDeduction + esiDeduction;
      const netSalary = grossSalary - totalDeduction;

      report.push({
        employeeId: emp._id,
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        email: emp.email,
        role: emp.role,
        shiftName,

        month: Number(month),
        year: Number(year),

        totalWorkingDays,
        presentDays,
        halfDays,
        leaveDays: approvedLeaves,
        absentDays,

        permission: {
          allowedMonthlyMinutes: 120,
          usedMinutes: totalPermissionMinutes,
          remainingMinutes: Math.max(0, 120 - totalPermissionMinutes),
        },

        late: {
          totalLateMinutes,
        },

        break: {
          allowedDailyMinutes: 60,
          totalExtraBreakMinutes,
          extraBreakDeduction: roundAmount(extraBreakDeduction),
        },

        salary: {
          monthlySalary: roundAmount(monthlySalary),
          perDaySalary: roundAmount(perDaySalary),
          salaryDays,
          grossSalary: roundAmount(grossSalary),
          basicSalary: roundAmount(basicSalary),
          pfDeduction: roundAmount(pfDeduction),
          esiDeduction: roundAmount(esiDeduction),
          totalDeduction: roundAmount(totalDeduction),
          netSalary: roundAmount(netSalary),
        },
      });
    }

    res.status(200).json({
      success: true,
      month: Number(month),
      year: Number(year),
      count: report.length,
      report,
    });
  } catch (error) {
    console.log("MONTHLY ATTENDANCE SALARY REPORT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GOOGLE PUNCH IN

exports.googlePunchIn = async (req, res) => {
  try {
    // ==========================================
    // FIND EMPLOYEE USING GOOGLE EMAIL
    // ==========================================

    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      email: req.user.email,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found for this Google account",
      });
    }

    // ==========================================
    // CHECK EXISTING ATTENDANCE
    // ==========================================

    let attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      date: today(),
    });

    // ==========================================
    // ALREADY PUNCHED IN
    // ==========================================

    if (attendance && attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Already punched in today",
      });
    }

    // ==========================================
    // CREATE NEW ATTENDANCE
    // ==========================================

    if (!attendance) {
      attendance = new Attendance({
        companyId: req.user.companyId,
        employeeId: employee._id,
        date: today(),
      });
    }

    attendance.punchIn = new Date();
    attendance.punchInSource = "google_login";
    attendance.status = "present";

    await attendance.save();

    res.json({
      success: true,
      message: "Google punch in saved",
      attendance,
    });
  } catch (error) {
    console.log("GOOGLE PUNCH IN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GOOGLE PUNCH OUT
exports.googlePunchOut = async (req, res) => {
  try {
    // ==========================================
    // FIND EMPLOYEE USING GOOGLE EMAIL
    // ==========================================

    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      email: req.user.email,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found for this Google account",
      });
    }

    // ==========================================
    // FIND TODAY ATTENDANCE
    // ==========================================

    const attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      date: today(),
    });

    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Punch in first",
      });
    }

    // ==========================================
    // ALREADY PUNCHED OUT
    // ==========================================

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message: "Already punched out",
      });
    }

    attendance.punchOut = new Date();
    attendance.punchOutSource = "google_login";

    calculateAttendance(attendance);

    await attendance.save();

    res.json({
      success: true,
      message: "Google punch out saved",
      attendance,
    });
  } catch (error) {
    console.log("GOOGLE PUNCH OUT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// BIOMETRIC PUNCH IN
exports.biometricPunchIn = async (req, res) => {
  try {
    const { employeeCode, biometricUserId } =
      req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!employeeCode && !biometricUserId) {
      return res.status(400).json({
        success: false,
        message:
          "employeeCode or biometricUserId is required",
      });
    }

    // ==========================================
    // FIND EMPLOYEE
    // ==========================================

    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      $or: [
        { employeeCode },
        { biometricUserId },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found for biometric",
      });
    }

    // ==========================================
    // CHECK ATTENDANCE
    // ==========================================

    let attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      date: today(),
    });

    // ==========================================
    // ALREADY PUNCHED IN
    // ==========================================

    if (attendance && attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Already punched in today",
      });
    }

    // ==========================================
    // CREATE ATTENDANCE
    // ==========================================

    if (!attendance) {
      attendance = new Attendance({
        companyId: req.user.companyId,
        employeeId: employee._id,
        date: today(),
      });
    }

    attendance.punchIn = new Date();
    attendance.punchInSource = "biometric";
    attendance.status = "present";

    await attendance.save();

    res.json({
      success: true,
      message: "Biometric punch in saved",
      attendance,
    });
  } catch (error) {
    console.log("BIOMETRIC PUNCH IN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// BIOMETRIC PUNCH OUT
exports.biometricPunchOut = async (req, res) => {
  try {
    const { employeeCode, biometricUserId } =
      req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!employeeCode && !biometricUserId) {
      return res.status(400).json({
        success: false,
        message:
          "employeeCode or biometricUserId is required",
      });
    }

    // ==========================================
    // FIND EMPLOYEE
    // ==========================================

    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      $or: [
        { employeeCode },
        { biometricUserId },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found for biometric",
      });
    }

    // ==========================================
    // FIND ATTENDANCE
    // ==========================================

    const attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      date: today(),
    });

    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Punch in first",
      });
    }

    // ==========================================
    // ALREADY PUNCHED OUT
    // ==========================================

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message: "Already punched out",
      });
    }

    attendance.punchOut = new Date();
    attendance.punchOutSource = "biometric";

    calculateAttendance(attendance);

    await attendance.save();

    res.json({
      success: true,
      message: "Biometric punch out saved",
      attendance,
    });
  } catch (error) {
    console.log("BIOMETRIC PUNCH OUT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// exports.getAttendance = async (req, res) => {
//   try {
//     const filter = {
//       companyId: req.user.companyId,
//     };

//     // ==========================================
//     // FILTER BY EMPLOYEE
//     // ==========================================

//     if (req.query.employeeId) {
//       filter.employeeId = req.query.employeeId;
//     }

//     // ==========================================
//     // FILTER BY DATE
//     // ==========================================

//     if (req.query.date) {
//       const start = new Date(req.query.date);
//       start.setHours(0, 0, 0, 0);

//       const end = new Date(req.query.date);
//       end.setHours(23, 59, 59, 999);

//       filter.date = {
//         $gte: start,
//         $lte: end,
//       };
//     }

//     const attendance = await Attendance.find(filter)
//       .populate(
//         "employeeId",
//         "fullName employeeCode department designation"
//       )
//       .sort({ date: -1 });

//     res.json({
//       success: true,
//       count: attendance.length,
//       attendance,
//     });
//   } catch (error) {
//     console.log("GET ATTENDANCE ERROR:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// ATTENDANCE CALENDAR VIEW

exports.getAttendanceCalendarView = async (req, res) => {

  try {

    const loggedInUserId = req.user?.userId || req.user?.id;

    const role = req.user.role;



    let employeeId = req.query.employeeId;



    if (role === "employee") {

      const emp = await Employee.findOne({

        userId: loggedInUserId,

        companyId: req.user.companyId,

      });



      if (!emp) {

        return res.status(404).json({

          success: false,

          message: "Employee not found",

        });

      }



      employeeId = emp._id;

    }



    if (!employeeId) {

      return res.status(400).json({

        success: false,

        message: "employeeId is required",

      });

    }



    const month = Number(req.query.month);

    const year = Number(req.query.year);



    if (!month || !year) {

      return res.status(400).json({

        success: false,

        message: "month and year are required",

      });

    }



    const startDate = new Date(year, month - 1, 1);

    startDate.setHours(0, 0, 0, 0);



    const endDate = new Date(year, month, 0);

    endDate.setHours(23, 59, 59, 999);



    const todayDate = new Date();

    todayDate.setHours(0, 0, 0, 0);



    const attendanceRecords = await Attendance.find({

      companyId: req.user.companyId,

      employeeId,

      date: {

        $gte: startDate,

        $lte: endDate,

      },

    });



    const leaveRecords = await Leave.find({

      companyId: req.user.companyId,

      employeeId,

      fromDate: { $lte: endDate },

      toDate: { $gte: startDate },

      status: {

        $in: ["pending_manager", "pending_hr", "approved"],

      },

    });



    const attendanceMap = {};



    attendanceRecords.forEach((attendance) => {

      const key = getDateKey(attendance.date);

      attendanceMap[key] = attendance;

    });



    const leaveMap = {};



    leaveRecords.forEach((leave) => {

      let current = new Date(leave.fromDate);

      current.setHours(0, 0, 0, 0);



      const leaveEnd = new Date(leave.toDate);

      leaveEnd.setHours(0, 0, 0, 0);



      while (current <= leaveEnd) {

        const key = getDateKey(current);



        leaveMap[key] = {

          leaveId: leave._id,

          leaveType: leave.leaveType,

          leaveStatus: leave.status,

          reason: leave.reason,

        };



        current.setDate(current.getDate() + 1);

      }

    });



    const calendar = [];



    let currentDate = new Date(startDate);



    while (currentDate <= endDate) {

      const dateKey = getDateKey(currentDate);



      const attendance = attendanceMap[dateKey];

      const leave = leaveMap[dateKey];



      let status = "upcoming";



      if (attendance) {

        status = attendance.status;

      } else if (leave && leave.leaveStatus === "approved") {

        status = "leave";

      } else if (

        leave &&

        ["pending_manager", "pending_hr"].includes(leave.leaveStatus)

      ) {

        status = "applied_leave";

      } else if (currentDate < todayDate) {

        status = "absent";

      } else {

        status = "upcoming";

      }



      calendar.push({

        date: dateKey,

        day: currentDate.toLocaleDateString("en-US", {

          weekday: "long",

          timeZone: "Asia/Kolkata",

        }),

        status,

        attendance: attendance

          ? {

              punchIn: attendance.punchIn,

              punchOut: attendance.punchOut,

              punchInSource: attendance.punchInSource,

              punchOutSource: attendance.punchOutSource,

              workingMinutes: attendance.workingMinutes,

              totalBreakMinutes: attendance.totalBreakMinutes,

              status: attendance.status,

            }

          : null,

        leave: leave || null,

      });



      currentDate.setDate(currentDate.getDate() + 1);

    }



    res.status(200).json({

      success: true,

      employeeId,

      month,

      year,

      calendar,

    });

  } catch (error) {

    console.log("ATTENDANCE CALENDAR ERROR:", error);



    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};


// GET SINGLE USER ATTENDANCE - DAILY BASIS
// exports.getAttendanceByUserId = async (req, res) => {

//   try {

//     const { employeeId } = req.params;



//     if (!employeeId) {

//       return res.status(400).json({

//         success: false,

//         message: "employeeId is required",

//       });

//     }



//     const start = new Date();

//     start.setHours(0, 0, 0, 0);



//     const end = new Date();

//     end.setHours(23, 59, 59, 999);



//     const attendance = await Attendance.findOne({

//       companyId: req.user.companyId,

//       employeeId,

//       date: {

//         $gte: start,

//         $lte: end,

//       },

//     }).populate(

//       "employeeId",

//       "fullName employeeCode email departmentId designationId"

//     );



//     if (!attendance) {

//       return res.status(200).json({

//         success: true,

//         message: "Employee is absent today",

//         status: "absent",

//         attendance: null,

//       });

//     }



//     res.status(200).json({

//       success: true,

//       message: "Today attendance found",

//       status: attendance.status,

//       attendance,

//     });

//   } catch (error) {

//     console.log("GET TODAY ATTENDANCE ERROR:", error);



//     res.status(500).json({

//       success: false,

//       message: error.message,

//     });

//   }

// };

// exports.getAttendanceByUserId = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     if (!employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: "employeeId is required",
//       });
//     }

//     const today = getISTDateString();

//     const yesterdayDate = new Date();
//     yesterdayDate.setDate(yesterdayDate.getDate() - 1);

//     const yesterday = yesterdayDate.toLocaleDateString("en-CA", {
//       timeZone: "Asia/Kolkata",
//     });

//     // Check active attendance only for today/yesterday
//     const activeAttendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId,
//       attendanceDate: { $in: [today, yesterday] },
//       punchIn: { $ne: null },
//       punchOut: null,
//     })
//       .sort({ punchIn: -1 })
//       .populate(
//         "employeeId",
//         "fullName employeeCode email departmentId designationId"
//       );

//     if (activeAttendance) {
//       return res.status(200).json({
//         success: true,
//         message: "Active attendance found",
//         status: activeAttendance.status,
//         attendance: activeAttendance,
//       });
//     }

//     // Check today's completed attendance
//     const attendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId,
//       attendanceDate: today,
//     }).populate(
//       "employeeId",
//       "fullName employeeCode email departmentId designationId"
//     );

//     if (!attendance) {
//       return res.status(200).json({
//         success: true,
//         message: "Employee is absent today",
//         status: "absent",
//         attendance: null,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Today attendance found",
//       status: attendance.status,
//       attendance,
//     });
//   } catch (error) {
//     console.log("GET TODAY ATTENDANCE ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


// exports.getAttendanceByUserId = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     if (!employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: "employeeId is required",
//       });
//     }

//     const employee = await Employee.findOne({
//       _id: employeeId,
//       companyId: req.user.companyId,
//     }).populate("shiftId", "shiftName name");

//     if (!employee) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee not found",
//       });
//     }

//     const shiftName =
//       employee.shiftId?.shiftName ||
//       employee.shiftId?.name ||
//       employee.shiftType ||
//       "Day Shift";

//     const currentAttendanceDate = getAttendanceDateByShift(shiftName);

//     const today = getISTDateString();

//     const yesterdayDate = new Date();
//     yesterdayDate.setDate(yesterdayDate.getDate() - 1);

//     const yesterday = yesterdayDate.toLocaleDateString("en-CA", {
//       timeZone: "Asia/Kolkata",
//     });

//     // 1. Active attendance for today/yesterday only
//     const activeAttendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId,
//       attendanceDate: { $in: [today, yesterday] },
//       punchIn: { $ne: null },
//       punchOut: null,
//     })
//       .sort({ punchIn: -1 })
//       .populate(
//         "employeeId",
//         "fullName employeeCode email departmentId designationId"
//       );

//     if (activeAttendance) {
//       return res.status(200).json({
//         success: true,
//         message: "Active attendance found",
//         status: activeAttendance.status,
//         attendanceState: "checked_in",
//         canPunchIn: false,
//         canPunchOut: true,
//         currentAttendanceDate,
//         attendance: activeAttendance,
//       });
//     }

//     // 2. Check current shift attendance date
//     const attendance = await Attendance.findOne({
//       companyId: req.user.companyId,
//       employeeId,
//       attendanceDate: currentAttendanceDate,
//     }).populate(
//       "employeeId",
//       "fullName employeeCode email departmentId designationId"
//     );

//     if (!attendance) {
//       return res.status(200).json({
//         success: true,
//         message: "No attendance for current shift",
//         status: "not_started",
//         attendanceState: "not_started",
//         canPunchIn: true,
//         canPunchOut: false,
//         currentAttendanceDate,
//         attendance: null,
//       });
//     }

//     if (attendance.punchIn && attendance.punchOut) {
//       return res.status(200).json({
//         success: true,
//         message: "Current shift attendance completed",
//         status: attendance.status,
//         attendanceState: "checked_out",
//         canPunchIn: false,
//         canPunchOut: false,
//         currentAttendanceDate,
//         attendance,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Current shift attendance found",
//       status: attendance.status,
//       attendanceState: "checked_in",
//       canPunchIn: false,
//       canPunchOut: true,
//       currentAttendanceDate,
//       attendance,
//     });
//   } catch (error) {
//     console.log("GET TODAY ATTENDANCE ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
const getAttendanceUIState = (attendance) => {
  // console.log("attendance", attendance);
  if (!attendance || !attendance.punchIn) {
    return {
      attendanceState: "not_started",
      canPunchIn: true,
      canPunchOut: false,
      canStartBreak: false,
      canEndBreak: false,
    };
  }

  if (attendance.punchOut) {
    return {
      attendanceState: "checked_out",
      canPunchIn: false,
      canPunchOut: false,
      canStartBreak: false,
      canEndBreak: false,
    };
  }

  const lastBreak = attendance.breaks?.[attendance.breaks.length - 1];

  if (lastBreak?.breakIn && !lastBreak?.breakOut) {
    return {
      attendanceState: "on_break",
      canPunchIn: false,
      canPunchOut: true,
      canStartBreak: false,
      canEndBreak: true,
    };
  }

  return {
    attendanceState: "checked_in",
    canPunchIn: false,
    canPunchOut: true,
    canStartBreak: true,
    canEndBreak: false,
  };
};

exports.getAttendanceByUserId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: req.user.companyId,
    }).populate("shiftId", "shiftName name shiftType startTime endTime");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
console.log("empoyee_shift", employee.shiftId);
    const shiftName =
      employee.shiftId?.shiftName ||
      employee.shiftId?.name ||
      employee.shiftType ||
      "Day Shift";

    const currentAttendanceDate = getAttendanceDateByShift(shiftName);

    const today = getISTDateString();

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const yesterday = yesterdayDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const activeAttendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId,
      attendanceDate: { $in: [today, yesterday, currentAttendanceDate] },
      punchIn: { $ne: null },
      punchOut: null,
    })
      .sort({ punchIn: -1 })
      .populate(
        "employeeId",
        "fullName employeeCode email departmentId designationId"
      );

    if (activeAttendance) {
      const uiState = getAttendanceUIState(activeAttendance);

      return res.status(200).json({
        success: true,
        message: "Active attendance found",
        status: activeAttendance.status,
        currentAttendanceDate,
        attendance: activeAttendance,
        ...uiState,
      });
    }

    const attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId,
      attendanceDate: currentAttendanceDate,
    }).populate(
      "employeeId",
      "fullName employeeCode email departmentId designationId"
    );

    if (!attendance) {
      const uiState = getAttendanceUIState(null);

      return res.status(200).json({
        success: true,
        message: "No attendance for current shift",
        status: "not_started",
        currentAttendanceDate,
        attendance: null,
        ...uiState,
      });
    }

    const uiState = getAttendanceUIState(attendance);

    return res.status(200).json({
      success: true,
      message:
        uiState.attendanceState === "checked_out"
          ? "Current shift attendance completed"
          : "Current shift attendance found",
      status: attendance.status,
      currentAttendanceDate,
      attendance,
      ...uiState,
    });
  } catch (error) {
    console.log("GET TODAY ATTENDANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};