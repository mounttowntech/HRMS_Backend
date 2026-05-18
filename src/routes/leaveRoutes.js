const router = require("express").Router();
const c = require("../controllers/leaveController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post("/apply", verifyToken, c.applyLeave);
router.patch(
  "/:id/manager-approval",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin"),
  c.managerApproval,
);
router.patch(
  "/:id/hr-approval",
  verifyToken,
  allowRoles("hr", "admin"),
  c.hrApproval,
);
router.get(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr", "teamlead", "projectmanager"),
  c.getLeaves,
);
module.exports = router;
