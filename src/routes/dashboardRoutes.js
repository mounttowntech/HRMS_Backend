const router = require("express").Router();
const c = require("../controllers/dashboardController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.get(
  "/employer",
  verifyToken,
  allowRoles("employer"),
  c.employerDashboard,
);
router.get(
  "/admin",
  verifyToken,
  allowRoles("admin", "employer"),
  c.adminDashboard,
);
router.get(
  "/hr",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  c.hrDashboard,
);
router.get(
  "/employee",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr", "admin"),
  c.employeeDashboard,
);
router.get(
  "/teamlead",
  verifyToken,
  allowRoles("teamlead", "admin", "employer"),
  c.teamLeadDashboard,
);
router.get(
  "/project-manager",
  verifyToken,
  allowRoles("projectmanager", "admin", "employer"),
  c.projectManagerDashboard,
);
module.exports = router;
