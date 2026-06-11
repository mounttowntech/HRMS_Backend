const router = require("express").Router();

const c = require("../controllers/leaveController");
const leaveUpload = require("../middleware/leaveUpload");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

// APPLY LEAVE WITH DOCUMENT UPLOAD
router.post(
  "/apply",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin", "hr", "employee"),
  leaveUpload.array("documents", 5),
  c.applyLeave
);

// GET ALL / ROLE BASED LEAVES
router.get(
  "/all",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager"),
  c.getLeaves
);

// GET MY LEAVES
router.get(
  "/my-leaves",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager"),
  c.getMyLeaves
);

// MANAGER APPROVAL
router.patch(
  "/:id/manager-approval",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin", "hr"),
  c.managerApproval
);

// HR APPROVAL
router.patch(
  "/:id/hr-approval",
  verifyToken,
  allowRoles("hr", "admin"),
  c.hrApproval
);

// UPDATE LEAVE WITH DOCUMENT UPLOAD
router.put(
  "/:id",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager"),
  leaveUpload.array("documents", 5),
  c.updateLeave
);

// DELETE LEAVE
router.delete(
  "/:id",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager"),
  c.deleteLeave
);

module.exports = router;