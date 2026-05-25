const router = require("express").Router();
const c = require("../controllers/bpoController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/:employeeId/voice-training",
  verifyToken,
  allowRoles("hr", "admin", "teamlead"),
  c.startVoiceTraining,
);
router.patch(
  "/:employeeId/assign-process-shift",
  verifyToken,
  allowRoles("hr", "admin", "teamlead"),
  c.assignProcessAndShift,
);
router.patch(
  "/:employeeId/mock-call-result",
  verifyToken,
  allowRoles("hr", "admin", "teamlead"),
  c.mockCallResult,
);
router.get(
  "/all",
  verifyToken,
  allowRoles("hr", "admin", "teamlead"),
  c.getBpoProcesses,
);
router.get(
  "/:employeeId",
  verifyToken,
  allowRoles("hr", "admin", "teamlead"),
  c.getSingleBpoProcess,
);
router.delete(
  "/:id",
  verifyToken,
  allowRoles("hr", "admin", "teamlead"),
  c.deleteBpoProcess,
);
module.exports = router;
