const router = require("express").Router();
const c = require("../controllers/projectController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "projectmanager"),
  c.createProject,
);
router.patch(
  "/:id/assign",
  verifyToken,
  allowRoles("employer", "admin", "projectmanager"),
  c.assignProject,
);
router.get("/", verifyToken, c.getProjects);
module.exports = router;
