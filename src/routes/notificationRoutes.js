const express = require("express");
const router = express.Router();

const {
  createNotification,
  getNotifications,
  markNotificationRead,
  deleteNotification,
} = require("../controllers/notificationController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createNotification);
router.get("/all", verifyToken, getNotifications);
router.put("/read/:id", verifyToken, markNotificationRead);
router.delete("/:id", verifyToken, deleteNotification);

module.exports = router;