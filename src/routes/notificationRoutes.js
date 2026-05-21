const express = require("express");
const router = express.Router();

const {
  createNotification,
  getNotifications,
  markNotificationRead,
  deleteNotification,
} = require("../controllers/notificationController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, createNotification);
router.get("/", verifyToken, getNotifications);
router.put("/:id/read", verifyToken, markNotificationRead);
router.delete("/:id", verifyToken, deleteNotification);

module.exports = router;