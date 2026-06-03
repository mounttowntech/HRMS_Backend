const router = require("express").Router();
const c = require("../controllers/taskController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/assign",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin"),
  c.assignTask,
);
router.patch("/:id/start", verifyToken, c.startTask);
router.patch("/:id/daily-update", verifyToken, c.addDailyUpdate);
router.patch("/:id/submit-review", verifyToken, c.submitTaskForReview);
router.patch(
  "/:id/review",
  verifyToken,
  allowRoles("teamlead", "projectmanager", "admin"),
  c.reviewTask,
);
router.get("/all", verifyToken, c.getTasks);
module.exports = router;
