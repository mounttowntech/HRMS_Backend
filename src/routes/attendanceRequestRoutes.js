const router = require("express").Router();

const c = require("../controllers/attendanceRequestController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  c.createAttendanceRequest
);

router.get(
  "/my",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  c.getMyAttendanceRequests
);

router.get(
  "/",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  c.getAttendanceRequests
);

router.patch(
  "/:id/status",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  c.updateAttendanceRequestStatus
);

module.exports = router;