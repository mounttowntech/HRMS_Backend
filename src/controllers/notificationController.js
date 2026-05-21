const Notification = require("../models/notificationModel");

exports.createNotification = async (req, res) => {
  try {
    const notification = await Notification.create({
      companyId: req.user.companyId,
      userId: req.body.userId || null,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || "info",
      isRead: false,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
      $or: [{ userId: req.user.id }, { userId: null }],
    };

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
        $or: [{ userId: req.user.id }, { userId: null }],
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
      $or: [{ userId: req.user.id }, { userId: null }],
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};