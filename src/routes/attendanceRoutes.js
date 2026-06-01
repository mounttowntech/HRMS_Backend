const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");
const { verifyToken ,allowRoles } = require("../middleware/authMiddleware");

router.post(
  "/employee/punch-in",
  verifyToken,
  attendanceController.employeePunchIn
);

router.post(
  "/employee/punch-out",
  verifyToken,
  attendanceController.employeePunchOut
);

router.post(
  "/google/punch-in",
  verifyToken,
  attendanceController.googlePunchIn
);

router.post(
  "/google/punch-out",
  verifyToken,
  attendanceController.googlePunchOut
);

router.post(
  "/biometric/punch-in",
  verifyToken,
  attendanceController.biometricPunchIn
);

router.post(
  "/biometric/punch-out",
  verifyToken,
  attendanceController.biometricPunchOut
);

router.post(
  "/break/start",
  verifyToken,
  attendanceController.startBreak
);

router.post(
  "/break/end",
  verifyToken,
  attendanceController.endBreak
);

router.get("/all", verifyToken, attendanceController.getAttendance);


router.get(
  "/calendar-view",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  attendanceController.getAttendanceCalendarView
);
module.exports = router;