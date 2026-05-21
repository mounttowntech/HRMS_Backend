const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const minutesDiff = (start, end) => {
  return Math.floor((new Date(end) - new Date(start)) / 60000);
};

const calculateAttendance = (attendance) => {
  const totalBreakMinutes = attendance.breaks.reduce(
    (sum, b) => sum + (b.minutes || 0),
    0
  );

  attendance.totalBreakMinutes = totalBreakMinutes;

  if (attendance.punchIn && attendance.punchOut) {
    const totalMinutes = minutesDiff(attendance.punchIn, attendance.punchOut);

    attendance.workingMinutes = Math.max(
      0,
      totalMinutes - totalBreakMinutes
    );

    attendance.status =
      attendance.workingMinutes < 240 ? "half_day" : "present";
  }

  return attendance;
};

const verifyEmployeePassword = async (companyId, employeeCode, password) => {
  const employee = await Employee.findOne({
    companyId,
    employeeCode,
  });

  if (!employee) return null;

  const user = await User.findOne({
    employeeId: employee._id,
    email: employee.email,
  }).select("+password");

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return null;

  return employee;
};

exports.employeePunchIn = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({
        success: false,
        message: "employeeCode and password are mandatory",
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
        message: "Invalid employee code or password",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: employee._id,
        date: today(),
      },
      {
        $setOnInsert: {
          companyId: req.user.companyId,
          employeeId: employee._id,
          date: today(),
        },
        $set: {
          punchIn: new Date(),
          punchInSource: "employee_login",
          status: "present",
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Punch in saved",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.employeePunchOut = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({
        success: false,
        message: "employeeCode and password are mandatory",
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
        message: "Invalid employee code or password",
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.googlePunchIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      email: req.user.email,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for this Google account",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: employee._id,
        date: today(),
      },
      {
        $setOnInsert: {
          companyId: req.user.companyId,
          employeeId: employee._id,
          date: today(),
        },
        $set: {
          punchIn: new Date(),
          punchInSource: "google_login",
          status: "present",
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Google punch in saved",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.googlePunchOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      email: req.user.email,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for this Google account",
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.biometricPunchIn = async (req, res) => {
  try {
    const { employeeCode, biometricUserId } = req.body;

    if (!employeeCode && !biometricUserId) {
      return res.status(400).json({
        success: false,
        message: "employeeCode or biometricUserId is required",
      });
    }

    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      $or: [{ employeeCode }, { biometricUserId }],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for biometric",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: employee._id,
        date: today(),
      },
      {
        $setOnInsert: {
          companyId: req.user.companyId,
          employeeId: employee._id,
          date: today(),
        },
        $set: {
          punchIn: new Date(),
          punchInSource: "biometric",
          status: "present",
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Biometric punch in saved",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.biometricPunchOut = async (req, res) => {
  try {
    const { employeeCode, biometricUserId } = req.body;

    if (!employeeCode && !biometricUserId) {
      return res.status(400).json({
        success: false,
        message: "employeeCode or biometricUserId is required",
      });
    }

    const employee = await Employee.findOne({
      companyId: req.user.companyId,
      $or: [{ employeeCode }, { biometricUserId }],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for biometric",
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.endBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;

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

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];

    if (!lastBreak || lastBreak.breakOut) {
      return res.status(400).json({
        success: false,
        message: "No active break",
      });
    }

    lastBreak.breakOut = new Date();
    lastBreak.minutes = minutesDiff(lastBreak.breakIn, lastBreak.breakOut);

    calculateAttendance(attendance);

    await attendance.save();

    res.json({
      success: true,
      message: "Break ended",
      attendance,
    });
  } catch (error) {
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

    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

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
      .populate("employeeId", "fullName employeeCode department designation")
      .sort({ date: -1 });

    res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};