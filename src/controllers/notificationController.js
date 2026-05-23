const Notification = require("../models/notificationModel");

// ================= TIME AGO FUNCTION =================
const getTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  if (seconds < 60) {
    return `${seconds} sec ago`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hr ago`;
  }

  return `${Math.floor(seconds / 86400)} days ago`;
};

// ================= CREATE NOTIFICATION =================
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

// ================= GET NOTIFICATIONS =================
exports.getNotifications = async (req, res) => {
  try {

    const filter = {
      companyId: req.user.companyId,
      $or: [
        { userId: req.user.id },
        { userId: null }
      ],
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    // ================= FORMAT RESPONSE =================
    const formattedNotifications = notifications.map((n) => ({
      _id: n._id,

      title: n.title,

      message: n.message,

      type: n.type,

      isRead: n.isRead,

      createdAt: n.createdAt,

      // 🔥 TIME CALCULATION
      timeAgo: getTimeAgo(n.createdAt),
    }));

    res.json({
      success: true,

      unreadCount,

      count: formattedNotifications.length,

      notifications: formattedNotifications,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= MARK AS READ =================
exports.markNotificationRead = async (req, res) => {
  try {

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
        $or: [
          { userId: req.user.id },
          { userId: null }
        ],
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
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

// ================= DELETE NOTIFICATION =================
exports.deleteNotification = async (req, res) => {
  try {

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
      $or: [
        { userId: req.user.id },
        { userId: null }
      ],
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