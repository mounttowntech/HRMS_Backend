const Holiday = require("../models/Holiday");
const { sendNotificationToRoles } = require("../utils/notificationHelper");

// ===============================================
// GET LOGGED USER ID
// ===============================================

const getUserId = (req) => req.user?.userId || req.user?.id;

// ===============================================
// CREATE HOLIDAY
// ===============================================

exports.createHoliday = async (req, res) => {
  try {
    const {
      holidayName,
      holidayDate,
      holidayType,
      description,
      isPaid,
    } = req.body;

    if (!holidayName || !holidayDate) {
      return res.status(400).json({
        success: false,
        message: "Holiday name and holiday date are required",
      });
    }

    const alreadyExists = await Holiday.findOne({
      companyId: req.user.companyId,
      holidayName: holidayName.trim(),
      holidayDate: new Date(holidayDate),
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Holiday already exists",
      });
    }

    const holiday = await Holiday.create({
      companyId: req.user.companyId,
      holidayName: holidayName.trim(),
      holidayDate,
      holidayType: holidayType || "Company",
      description,
      isPaid: isPaid ?? true,
      status: "active",
    });

    await sendNotificationToRoles({
      companyId: req.user.companyId,
      senderId: getUserId(req),
      roles: [
        "admin",
        "hr",
        "teamlead",
        "projectmanager",
        "employee",
      ],
      title: `New Holiday - ${holiday.holidayName}`,
      message: `${holiday.holidayName} has been declared as a holiday.`,
      type: "holiday",
      referenceId: holiday._id,
      referenceModel: "Holiday",
    });

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      holiday,
    });
  } catch (error) {
    console.log("CREATE HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// GET ALL HOLIDAYS
// ===============================================

exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({
      companyId: req.user.companyId,
    }).sort({
      holidayDate: 1,
    });

    res.status(200).json({
      success: true,
      total: holidays.length,
      holidays,
    });
  } catch (error) {
    console.log("GET HOLIDAYS ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// GET HOLIDAY BY ID
// ===============================================

exports.getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      holiday,
    });
  } catch (error) {
    console.log("GET HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// GET UPCOMING HOLIDAYS
// ===============================================

exports.getUpcomingHolidays = async (req, res) => {
  try {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const holidays = await Holiday.find({
      companyId: req.user.companyId,
      status: "active",
      holidayDate: {
        $gte: today,
      },
    })
      .sort({
        holidayDate: 1,
      })
      .limit(10);

    res.status(200).json({
      success: true,
      total: holidays.length,
      holidays,
    });
  } catch (error) {
    console.log("UPCOMING HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// UPDATE HOLIDAY
// ===============================================

exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    if (req.body.holidayName)
      holiday.holidayName = req.body.holidayName.trim();

    if (req.body.holidayDate)
      holiday.holidayDate = req.body.holidayDate;

    if (req.body.holidayType)
      holiday.holidayType = req.body.holidayType;

    if (req.body.description !== undefined)
      holiday.description = req.body.description;

    if (req.body.isPaid !== undefined)
      holiday.isPaid = req.body.isPaid;

    if (req.body.status)
      holiday.status = req.body.status;

    await holiday.save();

    await sendNotificationToRoles({
      companyId: req.user.companyId,
      senderId: getUserId(req),
      roles: [
        "admin",
        "hr",
        "teamlead",
        "projectmanager",
        "employee",
      ],
      title: "Holiday Updated",
      message: `${holiday.holidayName} holiday has been updated.`,
      type: "holiday",
      referenceId: holiday._id,
      referenceModel: "Holiday",
    });

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      holiday,
    });
  } catch (error) {
    console.log("UPDATE HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// DELETE HOLIDAY
// ===============================================

exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    console.log("DELETE HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// GET PAID HOLIDAYS
// ===============================================

exports.getPaidHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({
      companyId: req.user.companyId,
      status: "active",
      isPaid: true,
    }).sort({
      holidayDate: 1,
    });

    res.status(200).json({
      success: true,
      total: holidays.length,
      holidays,
    });
  } catch (error) {
    console.log("PAID HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================================
// GET HOLIDAYS BY MONTH
// ===============================================

exports.getHolidayByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const start = new Date(year, month - 1, 1);

    const end = new Date(year, month, 0);

    end.setHours(23, 59, 59, 999);

    const holidays = await Holiday.find({
      companyId: req.user.companyId,
      holidayDate: {
        $gte: start,
        $lte: end,
      },
    }).sort({
      holidayDate: 1,
    });

    res.status(200).json({
      success: true,
      total: holidays.length,
      holidays,
    });
  } catch (error) {
    console.log("MONTH HOLIDAY ERROR :", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};