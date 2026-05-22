const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ======================================================
// DATE HELPERS
// ======================================================

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const minutesDiff = (start, end) => {
  return Math.floor((new Date(end) - new Date(start)) / 60000);
};

// ======================================================
// CALCULATE ATTENDANCE
// ======================================================

const calculateAttendance = (attendance) => {
  const totalBreakMinutes = attendance.breaks.reduce(
    (sum, b) => sum + (b.minutes || 0),
    0
  );

  attendance.totalBreakMinutes = totalBreakMinutes;

  if (attendance.punchIn && attendance.punchOut) {
    const totalMinutes = minutesDiff(
      attendance.punchIn,
      attendance.punchOut
    );

    attendance.workingMinutes = Math.max(
      0,
      totalMinutes - totalBreakMinutes
    );

    attendance.status =
      attendance.workingMinutes < 240
        ? "half_day"
        : "present";
  }

  return attendance;
};

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

// ======================================================
// EMPLOYEE PUNCH IN
// ======================================================

exports.employeePunchIn = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({
        success: false,
        message:
          "employeeCode and password are mandatory",
      });
    }

    const employee = await verifyEmployeePassword(
      req.user.companyId,
      employeeCode,
      password
    );

    if (!employee) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid employee code or password",
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
    attendance.punchInSource = "employee_login";
    attendance.status = "present";

    await attendance.save();

    res.json({
      success: true,
      message: "Punch in saved",
      attendance,
    });
  } catch (error) {
    console.log("PUNCH IN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// EMPLOYEE PUNCH OUT
// ======================================================

exports.employeePunchOut = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({
        success: false,
        message:
          "employeeCode and password are mandatory",
      });
    }

    const employee = await verifyEmployeePassword(
      req.user.companyId,
      employeeCode,
      password
    );

    if (!employee) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid employee code or password",
      });
    }

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

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message: "Already punched out",
      });
    }

    attendance.punchOut = new Date();
    attendance.punchOutSource = "employee_login";

    calculateAttendance(attendance);

    await attendance.save();

    res.json({
      success: true,
      message: "Punch out saved",
      attendance,
    });
  } catch (error) {
    console.log("PUNCH OUT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// START BREAK
// ======================================================

exports.startBreak = async (req, res) => {
  try {
    const { employeeId, source } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    const attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId,
      date: today(),
    });

    if (!attendance || !attendance.punchIn) {
      return res.status(400).json({
        success: false,
        message: "Punch in first",
      });
    }

    if (attendance.punchOut) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot start break after punch out",
      });
    }

    const lastBreak =
      attendance.breaks[
        attendance.breaks.length - 1
      ];

    if (lastBreak && !lastBreak.breakOut) {
      return res.status(400).json({
        success: false,
        message: "Break already started",
      });
    }

    attendance.breaks.push({
      breakIn: new Date(),
      source: source || "manual",
    });

    await attendance.save();

    res.json({
      success: true,
      message: "Break started",
      attendance,
    });
  } catch (error) {
    console.log("BREAK START ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// END BREAK
// ======================================================

exports.endBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    // ==========================================
    // FIND ATTENDANCE
    // ==========================================

    const attendance =
      await Attendance.findOne({
        companyId: req.user.companyId,
        employeeId,
        date: today(),
      });

    if (
      !attendance ||
      !attendance.punchIn
    ) {
      return res.status(400).json({
        success: false,
        message: "Punch in first",
      });
    }

    // ==========================================
    // FIND ACTIVE BREAK
    // ==========================================

    const lastBreak =
      attendance.breaks[
        attendance.breaks.length - 1
      ];

    if (
      !lastBreak ||
      lastBreak.breakOut
    ) {
      return res.status(400).json({
        success: false,
        message: "No active break",
      });
    }

    // ==========================================
    // END BREAK
    // ==========================================

    lastBreak.breakOut =
      new Date();

    lastBreak.minutes =
      minutesDiff(
        lastBreak.breakIn,
        lastBreak.breakOut
      );

    calculateAttendance(
      attendance
    );

    await attendance.save();

    // ==========================================
    // FORMAT TIME
    // ==========================================

    const formattedBreak =
      {
        breakIn:
          lastBreak.breakIn.toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            }
          ),

        breakOut:
          lastBreak.breakOut.toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            }
          ),

        minutes:
          lastBreak.minutes,

        source:
          lastBreak.source,
      };

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      success: true,
      message: "Break ended",

      breakDetails:
        formattedBreak,

      attendance,
    });
  } catch (error) {
    console.log(
      "BREAK END ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ATTENDANCE
// ======================================================
// ======================================================
// GOOGLE PUNCH IN
// ======================================================

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

// ======================================================
// GOOGLE PUNCH OUT
// ======================================================

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

// ======================================================
// BIOMETRIC PUNCH IN
// ======================================================

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

// ======================================================
// BIOMETRIC PUNCH OUT
// ======================================================

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
exports.getAttendance = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    // ==========================================
    // FILTER BY EMPLOYEE
    // ==========================================

    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    // ==========================================
    // FILTER BY DATE
    // ==========================================

    if (req.query.date) {
      const start = new Date(req.query.date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(req.query.date);
      end.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: start,
        $lte: end,
      };
    }

    const attendance = await Attendance.find(filter)
      .populate(
        "employeeId",
        "fullName employeeCode department designation"
      )
      .sort({ date: -1 });

    res.json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.log("GET ATTENDANCE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};