const router = require("express").Router();

const c = require("../controllers/leaveController");
const leaveUpload = require("../middleware/leaveUpload");
const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/apply",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin", "hr", "employee"),
  leaveUpload.array("documents", 5),
  c.applyLeave
);

router.patch(
  "/:id/manager-approval",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin", "hr"),
  c.managerApproval
);

router.patch(
  "/:id/hr-approval",
  verifyToken,
  allowRoles("hr", "admin"),
  c.hrApproval
);

router.get(
  "/all",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager"),
  c.getLeaves
);

router.get(
  "/my-leaves",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager"),
  c.getMyLeaves
);

module.exports = router;