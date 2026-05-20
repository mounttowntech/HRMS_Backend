const router = require("express").Router();

const recruitmentController = require("../controllers/recruitmentController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/jobs",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  recruitmentController.createJobPost
);

router.post(
  "/candidates",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  recruitmentController.applyCandidate
);

router.put(
  "/candidates/:candidateId/resume-screening",
  verifyToken,
  allowRoles("employer", "hr", "admin"),
  recruitmentController.resumeScreening
);

router.patch(
  "/candidates/:candidateId/hr-interview",
  verifyToken,
  allowRoles("employer", "hr", "admin"),
  recruitmentController.hrInterview
);

router.patch(
  "/candidates/:candidateId/technical-round",
  verifyToken,
  allowRoles("employer", "hr", "admin", "projectmanager", "teamlead"),
  recruitmentController.technicalRound
);

router.post(
  "/candidates/:candidateId/create-employee",
  verifyToken,
  allowRoles("employer", "hr", "admin"),
  recruitmentController.createEmployeeFromCandidate
);

module.exports = router;