const router = require("express").Router();

const c = require("../controllers/notificationController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  c.createNotification
);

router.post(
  "/role",
  verifyToken,
  allowRoles("admin", "hr", "teamlead","projectmanager"),
  c.createRoleNotification
);
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  c.getAllNotifications
);
router.get(
  "/my",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin", "employer"),
  c.getMyNotifications
);

router.get(
  "/unread-count",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin", "employer"),
  c.getUnreadCount
);

router.patch(
  "/read-all",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin", "employer"),
  c.markAllAsRead
);

router.patch(
  "/:id/read",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin", "employer"),
  c.markAsRead
);

router.delete(
  "/:id",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin", "employer"),
  c.deleteNotification
);

module.exports = router;