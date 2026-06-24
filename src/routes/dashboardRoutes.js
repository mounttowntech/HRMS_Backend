const express = require("express");
const router = express.Router();

const {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
  getTeamLeadDashboard,
  getProjectManagerDashboard,
  getRecruitmentDashboard
} = require("../controllers/dashboardController");

const { verifyToken,allowRoles } = require("../middleware/authMiddleware");

router.get("/admin", verifyToken, getAdminDashboard);
router.get("/hr", verifyToken, getHRDashboard);
router.get("/employee", verifyToken, getEmployeeDashboard);
router.get("/teamlead", verifyToken, getTeamLeadDashboard);
router.get("/project-manager", verifyToken, getProjectManagerDashboard);
router.get(
  "/recruitment",
  verifyToken,
  allowRoles("admin", "hr"),
  getRecruitmentDashboard
);

module.exports = router;