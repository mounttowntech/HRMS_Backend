const Holiday = require("../models/holiday");
const {sendNotificationToRoles } = require("../utils/notificationHelper");
const getUserId = (req) => req.user?.userId || req.user?.id;

exports.createHoliday = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;
     const userId = getUserId(req);

    const holiday = await Holiday.create({
      companyId: req.user.companyId,
      name,
      date,
      type,
      description,
    });

    const notifyRoles = ["admin","teamlead", "projectmanager", "hr", "employee"];
    await sendNotificationToRoles({
          companyId: req.user.companyId,
          senderId: userId,
          roles: notifyRoles,
          title: `New Holiday: ${name}`,
          message: description,
          type: "general",
          referenceId: holiday._id,
          referenceModel: "Holiday",
        });

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create holiday",
      error: error.message,
    });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({
      companyId: req.user.companyId,
      status: "active",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch holidays",
      error: error.message,
    });
  }
};

exports.getUpcomingHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({
      companyId: req.user.companyId,
      status: "active",
      date: { $gte: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming holidays",
      error: error.message,
    });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update holiday",
      error: error.message,
    });
  }
};

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
    res.status(500).json({
      success: false,
      message: "Failed to delete holiday",
      error: error.message,
    });
  }
};