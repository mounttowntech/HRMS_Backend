const router = require("express").Router();
const c = require("../controllers/onboardingController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/:employeeId/start",
  verifyToken,
  allowRoles("hr", "admin"),
  c.startOnboarding,
);
router.patch("/:employeeId/step", verifyToken, c.updateStep);
router.patch(
  "/:employeeId/hr-verify",
  verifyToken,
  allowRoles("hr", "admin"),
  c.hrVerify,
);
router.post(
  "/:employeeId/activate",
  verifyToken,
  allowRoles("admin", "hr"),
  c.assignAdminAccessAndActivate,
);
module.exports = router;
