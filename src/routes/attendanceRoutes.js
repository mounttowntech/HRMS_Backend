const express = require("express");
const router = express.Router();
const {employeePunchIn, employeePunchOut,startBreak,endBreak,getAttendance,getMonthlyAttendanceSalaryReport,googlePunchIn,googlePunchOut,biometricPunchIn,biometricPunchOut,getAttendanceCalendarView,getAttendanceByUserId} = require("../controllers/attendanceController");
const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/punch-in",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  employeePunchIn
);

router.post(
  "/punch-out",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  employeePunchOut
);

router.post(
  "/break/start",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  startBreak
);

router.post(
  "/break/end",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  endBreak
);



router.get(
  "/monthly-salary-report",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  getMonthlyAttendanceSalaryReport
);




router.post(
  "/google/punch-in",
  verifyToken,
  googlePunchIn
);

router.post(
  "/google/punch-out",
  verifyToken,
  googlePunchOut
);

router.post(
  "/biometric/punch-in",
  verifyToken,
  biometricPunchIn
);

router.post(
  "/biometric/punch-out",
  verifyToken,
 biometricPunchOut
);



router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employer", "teamlead", "projectmanager"),
  getAttendance
);

router.get(
  "/calendar-view",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
 getAttendanceCalendarView
);


router.get(
  "/user-daily/:employeeId",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
 getAttendanceByUserId
);
module.exports = router;