const Attendance = require("../model/attendanceModel");
const Employee = require("../model/employeeModel");

exports.punchIn = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already punched in today",
      });
    }

    const attendance = await Attendance.create({
      employeeId: employee._id,
      punchIn: new Date(),
      status: "Present",
    });

    res.status(201).json({
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

exports.punchOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: today },
    });

    attendance.punchOut = new Date();

    const diffMs = attendance.punchOut - attendance.punchIn;
    attendance.totalWorkingHours = Number(
      (diffMs / (1000 * 60 * 60)).toFixed(2)
    );

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Punch out successful",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const attendance = await Attendance.find({
      employeeId: employee._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
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

exports.getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate({
        path: "employeeId",
        populate: {
          path: "userId",
          select: "userName email role",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
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