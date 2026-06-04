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
router.get(
  "/job-posts",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  recruitmentController.getAllJobPosts
);

router.get(
  "/job-posts/:jobPostId",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  recruitmentController.getJobPostById
);

router.put(
  "/job-posts/:jobPostId",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  recruitmentController.updateJobPostById
);

router.delete(
  "/job-posts/:jobPostId",
  verifyToken,
  allowRoles("hr", "admin", "employer"),
  recruitmentController.deleteJobPostById
);
module.exports = router;