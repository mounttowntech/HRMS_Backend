const router = require("express").Router();
const c = require("../controllers/recruitmentController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/jobs",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createJobPost,
);
router.post(
  "/candidates",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.applyCandidate,
);
router.patch(
  "/candidates/:candidateId/resume-screening",
  verifyToken,
  allowRoles("hr", "admin"),
  c.resumeScreening,
);
router.patch(
  "/candidates/:candidateId/hr-interview",
  verifyToken,
  allowRoles("hr", "admin"),
  c.hrInterview,
);
router.patch(
  "/candidates/:candidateId/technical-round",
  verifyToken,
  allowRoles("hr", "admin", "projectmanager", "teamlead"),
  c.technicalRound,
);
router.post(
  "/candidates/:candidateId/create-employee",
  verifyToken,
  allowRoles("hr", "admin"),
  c.createEmployeeFromCandidate,
);
module.exports = router;
