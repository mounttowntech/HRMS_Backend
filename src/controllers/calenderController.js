const CalendarEvent = require("../models/calenderEventModel");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

exports.createEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create({
      companyId: req.user.companyId,
      title: req.body.title,
      type: req.body.type || "event",
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      description: req.body.description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Calendar event created successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.startDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const events = await CalendarEvent.find(filter)
      .populate("createdBy", "name email role")
      .sort({ startDate: 1 });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await CalendarEvent.find({
      companyId: req.user.companyId,
      type: "holiday",
    }).sort({ startDate: 1 });

    res.json({
      success: true,
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAttendanceCalendar = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.user.role === "employee") {
      filter.employeeId = req.user.employeeId;
    }

    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    const attendance = await Attendance.find(filter)
      .populate("employeeId", "fullName employeeCode department designation")
      .sort({ date: 1 });

    const calendarData = attendance.map((item) => ({
      id: item._id,
      title: item.status,
      date: item.date,
      status: item.status,
      punchIn: item.punchIn,
      punchOut: item.punchOut,
      employee: item.employeeId,
    }));

    res.json({
      success: true,
      count: calendarData.length,
      calendarData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getLeaveCalendar = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
      status: "approved",
    };

    if (req.user.role === "employee") {
      filter.employeeId = req.user.employeeId;
    }

    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    const leaves = await Leave.find(filter)
      .populate("employeeId", "fullName employeeCode department designation")
      .sort({ fromDate: 1 });

    const calendarData = leaves.map((leave) => ({
      id: leave._id,
      title: leave.leaveType,
      startDate: leave.fromDate,
      endDate: leave.toDate,
      days: leave.days,
      status: leave.status,
      employee: leave.employeeId,
    }));

    res.json({
      success: true,
      count: calendarData.length,
      calendarData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Calendar event not found",
      });
    }

    res.json({
      success: true,
      message: "Calendar event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};