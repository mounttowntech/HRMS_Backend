const AttendanceRequest = require("../models/attendanceRequest");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const {
  calculateAttendance,
  minutesDiff,
} = require("../utils/attendanceCalculator");

const {
  sendNotificationToRoles,
  sendNotificationToUser,
} = require("../utils/notificationHelper");

const getUserId = (req) => req.user?.userId || req.user?.id;

const calculateBreakMinutes = (breakIn, breakOut) => {
  if (!breakIn || !breakOut) return 0;

  const minutes = minutesDiff(breakIn, breakOut);
  return minutes > 0 ? minutes : 0;
};

exports.createAttendanceRequest = async (req, res) => {
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

    const {
      requestType,
      attendanceDate,
      requestedPunchIn,
      requestedPunchOut,
      breakIn,
      breakOut,
      reason,
    } = req.body;

    if (!requestType || !attendanceDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "requestType, attendanceDate and reason are required",
      });
    }

    if (requestType === "forgot_checkin" && !requestedPunchIn) {
      return res.status(400).json({
        success: false,
        message: "requestedPunchIn is required",
      });
    }

    if (requestType === "forgot_checkout" && !requestedPunchOut) {
      return res.status(400).json({
        success: false,
        message: "requestedPunchOut is required",
      });
    }

    if (
      requestType === "missed_attendance" &&
      (!requestedPunchIn || !requestedPunchOut)
    ) {
      return res.status(400).json({
        success: false,
        message: "requestedPunchIn and requestedPunchOut are required",
      });
    }

    // if (
    //   ["forgot_break_start", "break_correction"].includes(requestType) &&
    //   (!breakIn || !breakOut)
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "breakIn and breakOut are required",
    //   });
    // }

    if (
  requestType === "forgot_break_start" &&
  !breakIn
) {
  return res.status(400).json({
    success: false,
    message: "breakIn is required",
  });
}



    if (requestType === "forgot_break_end" && !breakOut) {
      return res.status(400).json({
        success: false,
        message: "breakOut is required",
      });
    }

    if (
  requestType === "break_correction" &&
  (!breakIn || !breakOut)
) {
  return res.status(400).json({
    success: false,
    message: "breakIn and breakOut are required",
  });
}

    const existingPending = await AttendanceRequest.findOne({
      companyId: req.user.companyId,
      employeeId: employee._id,
      attendanceDate,
      requestType,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "Pending request already exists for this date",
      });
    }

    const request = await AttendanceRequest.create({
      companyId: req.user.companyId,
      employeeId: employee._id,
      requestType,
      attendanceDate,
      requestedPunchIn: requestedPunchIn || null,
      requestedPunchOut: requestedPunchOut || null,
      breakIn: breakIn || null,
      breakOut: breakOut || null,
      breakMinutes: calculateBreakMinutes(breakIn, breakOut),
      reason,
      status: "pending",
    });

    await sendNotificationToRoles({
      companyId: req.user.companyId,
      senderId: userId,
      roles: ["hr", "admin", "employer"],
      title: "Attendance Correction Request",
      message: `${employee.fullName} requested attendance correction for ${attendanceDate}.`,
      type: "attendance",
      referenceId: request._id,
      referenceModel: "AttendanceRequest",
    });

    res.status(201).json({
      success: true,
      message: "Attendance request submitted successfully",
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Attendance request failed",
      error: error.message,
    });
  }
};

exports.getAttendanceRequests = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const requests = await AttendanceRequest.find(filter)
      .populate("employeeId", "fullName employeeCode email")
      .populate("approvedBy", "userName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance requests",
      error: error.message,
    });
  }
};

exports.getMyAttendanceRequests = async (req, res) => {
  try {
    const userId = getUserId(req);

    const employee = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const requests = await AttendanceRequest.find({
      companyId: req.user.companyId,
      employeeId: employee._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch my attendance requests",
      error: error.message,
    });
  }
};

exports.updateAttendanceRequestStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be approved or rejected",
      });
    }

    const request = await AttendanceRequest.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("employeeId", "fullName userId employeeCode email shiftId");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Attendance request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      });
    }

    request.status = status;
    request.remarks = remarks || "";
    request.approvedBy = getUserId(req);

    if (status === "approved") {
      const dateStart = new Date(`${request.attendanceDate}T00:00:00+05:30`);

      let attendance = await Attendance.findOne({
        companyId: req.user.companyId,
        employeeId: request.employeeId._id,
        attendanceDate: request.attendanceDate,
      });

      if (!attendance) {
        attendance = new Attendance({
          companyId: req.user.companyId,
          employeeId: request.employeeId._id,
          attendanceDate: request.attendanceDate,
          date: dateStart,
          breaks: [],
          attendanceMode: "regularization",
        });
      }

      if (request.requestedPunchIn) {
        attendance.punchIn = request.requestedPunchIn;
        attendance.punchInSource = "regularization";
      }

      if (request.requestedPunchOut) {
        attendance.punchOut = request.requestedPunchOut;
        attendance.punchOutSource = "regularization";
      }

      if (
        ["forgot_break_start", "break_correction"].includes(request.requestType)
      ) {
        attendance.breaks.push({
          breakIn: request.breakIn,
          breakOut: request.breakOut,
          minutes: request.breakMinutes,
          source: "regularization",
        });
      }

      if (request.requestType === "forgot_break_end") {
        const lastBreak = attendance.breaks[attendance.breaks.length - 1];

        if (!lastBreak || lastBreak.breakOut) {
          return res.status(400).json({
            success: false,
            message: "No active break found to close",
          });
        }

        lastBreak.breakOut = request.breakOut;
        lastBreak.minutes = calculateBreakMinutes(
          lastBreak.breakIn,
          request.breakOut
        );
        lastBreak.source = "regularization";
      }

      calculateAttendance(attendance);
      await attendance.save();
    }

    await request.save();

    if (request.employeeId?.userId) {
      await sendNotificationToUser({
        companyId: req.user.companyId,
        senderId: getUserId(req),
        receiverId: request.employeeId.userId,
        title:
          status === "approved"
            ? "Attendance Request Approved"
            : "Attendance Request Rejected",
        message:
          status === "approved"
            ? `Your attendance request for ${request.attendanceDate} was approved.`
            : `Your attendance request for ${request.attendanceDate} was rejected.`,
        type: "attendance",
        referenceId: request._id,
        referenceModel: "AttendanceRequest",
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance request ${status} successfully`,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update attendance request",
      error: error.message,
    });
  }
};