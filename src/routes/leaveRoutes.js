const router = require("express").Router();
const c = require("../controllers/leaveController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post("/apply", verifyToken, c.applyLeave);
router.patch(
  "/:id/manager-approval",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin","hr"),
  c.managerApproval,
);
router.patch(
  "/:id/hr-approval",
  verifyToken,
  allowRoles("hr", "admin"),
  c.hrApproval,
);
router.get(
  "/all",
  verifyToken,
  allowRoles("employer", "admin", "hr", "teamlead", "projectmanager"),
  c.getLeaves,
);
module.exports = router;
