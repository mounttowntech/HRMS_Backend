const router = require("express").Router();
const c = require("../controllers/attendanceController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post("/punch-in", verifyToken, c.punchIn);
router.post("/break/start", verifyToken, c.startBreak);
router.post("/break/end", verifyToken, c.endBreak);
router.post("/punch-out", verifyToken, c.punchOut);
router.get(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr", "teamlead", "projectmanager"),
  c.getAttendance,
);
module.exports = router;
