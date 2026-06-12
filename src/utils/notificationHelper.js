const Notification = require("../models/notificationModel");
const User = require("../models/User");

exports.sendNotificationToRoles = async ({
  companyId,
  senderId,
  roles,
  title,
  message,
  type,
  referenceId = null,
  referenceModel = "",
}) => {
  const users = await User.find({
    companyId,
    role: { $in: roles },
  }).select("_id");

  if (!users.length) return [];

  const notifications = users.map((user) => ({
    companyId,
    senderId,
    receiverId: user._id,
    title,
    message,
    type,
    referenceId,
    referenceModel,
  }));

  return await Notification.insertMany(notifications);
};

exports.sendNotificationToUser = async ({
  companyId,
  senderId,
  receiverId,
  title,
  message,
  type,
  referenceId = null,
  referenceModel = "",
}) => {
  if (!receiverId) return null;

  return await Notification.create({
    companyId,
    senderId,
    receiverId,
    title,
    message,
    type,
    referenceId,
    referenceModel,
  });
};