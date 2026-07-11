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
  allowRoles("hr", "admin", "employer", "teamlead", "projectmanager"),
  c.getAttendanceRequests
);

router.patch(
  "/:id/status",
  verifyToken,
  allowRoles("hr", "admin", "employer", "teamlead", "projectmanager", "employee"),
  c.updateAttendanceRequestStatus
);

//get attendance data use by attendance date
router.get(
  "/attendance-data/:date",
  verifyToken,
  allowRoles("hr", "admin", "employer", "teamlead", "projectmanager"),
  c.getAttendanceDataByDate
);

module.exports = router;