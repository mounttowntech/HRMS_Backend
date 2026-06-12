const Notification = require("../models/notificationModel");
const User = require("../models/User");

const getUserId = (req) => req.user?.userId || req.user?.id;

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

// CREATE SINGLE NOTIFICATION
exports.createNotification = async (req, res) => {
  try {
    const {
      receiverId,
      title,
      message,
      type,
      referenceId,
      referenceModel,
    } = req.body;

    if (!receiverId || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "receiverId, title, message and type are required",
      });
    }

    const receiver = await User.findOne({
      _id: receiverId,
      companyId: req.user.companyId,
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver user not found",
      });
    }

    const notification = await Notification.create({
      companyId: req.user.companyId,
      senderId: getUserId(req),
      receiverId,
      title,
      message,
      type,
      referenceId: referenceId || null,
      referenceModel: referenceModel || "",
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

// CREATE ROLE BASED NOTIFICATION
exports.createRoleNotification = async (req, res) => {
  try {
    const {
      roles,
      title,
      message,
      type,
      referenceId,
      referenceModel,
    } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "roles must be a non-empty array",
      });
    }

    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "title, message and type are required",
      });
    }

    const users = await User.find({
      companyId: req.user.companyId,
      role: { $in: roles },
    }).select("_id role email");

    const notifications = users.map((user) => ({
      companyId: req.user.companyId,
      senderId: getUserId(req),
      receiverId: user._id,
      title,
      message,
      type,
      referenceId: referenceId || null,
      referenceModel: referenceModel || "",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: "Role based notification created successfully",
      count: notifications.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create role notification",
      error: error.message,
    });
  }
};

// GET MY NOTIFICATIONS
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);

    const filter = {
      companyId: req.user.companyId,
      receiverId: userId,
    };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.isRead === "true") filter.isRead = true;
    if (req.query.isRead === "false") filter.isRead = false;

    const notifications = await Notification.find(filter)
      .populate("senderId", "name userName email role")
      .sort({ createdAt: -1 })
      .lean();

    const formattedNotifications = notifications.map((item) => ({
      ...item,
      timeAgo: getTimeAgo(item.createdAt),
    }));

    res.status(200).json({
      success: true,
      count: formattedNotifications.length,
      notifications: formattedNotifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};
// GET ALL NOTIFICATIONS - ADMIN / HR / EMPLOYER
exports.getAllNotifications = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.isRead === "true") {
      filter.isRead = true;
    }

    if (req.query.isRead === "false") {
      filter.isRead = false;
    }

    if (req.query.receiverId) {
      filter.receiverId = req.query.receiverId;
    }

    const notifications = await Notification.find(filter)
      .populate("senderId", "name userName email role")
      .populate("receiverId", "name userName email role")
      .sort({ createdAt: -1 })
      .lean();

    const formattedNotifications = notifications.map((item) => ({
      ...item,
      timeAgo: getTimeAgo(item.createdAt),
    }));

    res.status(200).json({
      success: true,
      count: formattedNotifications.length,
      notifications: formattedNotifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all notifications",
      error: error.message,
    });
  }
};
// GET UNREAD COUNT
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = getUserId(req);

    const unreadCount = await Notification.countDocuments({
      companyId: req.user.companyId,
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

// MARK SINGLE READ
exports.markAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
        receiverId: userId,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// MARK ALL READ
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);

    await Notification.updateMany(
      {
        companyId: req.user.companyId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {
    const userId = getUserId(req);

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
      receiverId: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};