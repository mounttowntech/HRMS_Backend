const express = require("express");
const router = express.Router();

const {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
  getTeamLeadDashboard,
  getProjectManagerDashboard,
} = require("../controllers/dashboardController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/admin", verifyToken, getAdminDashboard);
router.get("/hr", verifyToken, getHRDashboard);
router.get("/employee", verifyToken, getEmployeeDashboard);
router.get("/teamlead", verifyToken, getTeamLeadDashboard);
router.get("/project-manager", verifyToken, getProjectManagerDashboard);

module.exports = router;