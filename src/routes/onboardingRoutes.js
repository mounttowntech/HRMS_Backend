const router = require("express").Router();
const c = require("../controllers/onboardingController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/:employeeId/start",
  verifyToken,
  allowRoles("employer","hr", "admin"),
  c.startOnboarding,
);
router.put("/:employeeId/step", verifyToken, c.updateStep);
router.patch(
  "/:employeeId/hr-verify",
  verifyToken,
  allowRoles("employer","hr", "admin"),
  c.hrVerify,
);
router.post(
  "/:employeeId/activate",
  verifyToken,
  allowRoles("employer","admin", "hr"),
  c.assignAdminAccessAndActivate,
);
module.exports = router;
