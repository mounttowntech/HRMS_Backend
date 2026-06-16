const Notification = require("../models/notificationModel");
const User = require("../models/User");

const sendNotificationToRoles = async ({
  companyId,
  senderId,
  roles = [],
  title,
  message,
  type,
  referenceId,
  referenceModel,
}) => {
  try {
    roles = [...new Set(roles)].filter((role) => role !== "employee");

    const users = await User.find({
      companyId,
      role: { $in: roles },
      _id: { $ne: senderId },
    }).select("_id role email");

    const uniqueUsers = [
      ...new Map(users.map((user) => [user._id.toString(), user])).values(),
    ];

    const notifications = [];

    for (const user of uniqueUsers) {
      const exists = await Notification.findOne({
        companyId,
        receiverId: user._id,
        type,
        referenceId,
        referenceModel,
      });

      if (!exists) {
        notifications.push({
          companyId,
          senderId,
          receiverId: user._id,
          title,
          message,
          type,
          referenceId: referenceId || null,
          referenceModel: referenceModel || "",
          isRead: false,
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.log("SEND ROLE NOTIFICATION ERROR:", error.message);
    return [];
  }
};

const sendNotificationToUser = async ({
  companyId,
  senderId,
  receiverId,
  title,
  message,
  type,
  referenceId,
  referenceModel,
}) => {
  try {
    const exists = await Notification.findOne({
      companyId,
      receiverId,
      type,
      referenceId,
      referenceModel,
    });

    if (exists) return exists;

    return await Notification.create({
      companyId,
      senderId,
      receiverId,
      title,
      message,
      type,
      referenceId: referenceId || null,
      referenceModel: referenceModel || "",
      isRead: false,
    });
  } catch (error) {
    console.log("SEND USER NOTIFICATION ERROR:", error.message);
    return null;
  }
};

module.exports = {
  sendNotificationToRoles,
  sendNotificationToUser,
};