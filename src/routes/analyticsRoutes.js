const express = require("express");
const router = express.Router();

const {
  monthlyAttendance,
  teamAttendancePercentage,
  productivityAnalytics,
  employeeOverview,
  departmentWiseEmployees,
} = require("../controllers/analyticsController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/monthly-attendance", verifyToken, monthlyAttendance);
router.get("/team-attendance-percentage", verifyToken, teamAttendancePercentage);
router.get("/productivity", verifyToken, productivityAnalytics);
router.get("/employee-overview", verifyToken, employeeOverview);
router.get("/department-wise-employees", verifyToken, departmentWiseEmployees);

module.exports = router;