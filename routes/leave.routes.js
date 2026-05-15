const express = require("express");
const router = express.Router();

const {
  applyLeave,
  managerApproveLeave,
  hrApproveLeave,
  rejectLeave,
  getMyLeaves,
  getAllLeaves,
} = require("../controllers/leaveControllers");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post(
  "/apply",
  verifyToken,
  allowRoles("Employee", "Team Lead", "Project Manager", "HR"),
  applyLeave
);

router.put(
  "/manager-approve/:leaveId",
  verifyToken,
  allowRoles("Team Lead", "Project Manager", "Admin"),
  managerApproveLeave
);

router.put(
  "/hr-approve/:leaveId",
  verifyToken,
  allowRoles("HR", "Admin"),
  hrApproveLeave
);

router.put(
  "/reject/:leaveId",
  verifyToken,
  allowRoles("Team Lead", "Project Manager", "HR", "Admin"),
  rejectLeave
);

router.get(
  "/my-leaves",
  verifyToken,
  getMyLeaves
);

router.get(
  "/all",
  verifyToken,
  allowRoles("HR", "Admin", "Project Manager"),
  getAllLeaves
);

module.exports = router;