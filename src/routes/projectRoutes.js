const router = require("express").Router();
const c = require("../controllers/projectController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "teamlead"),
  c.createProject,
);
router.patch(
  "/:id/assign",
  verifyToken,
  allowRoles("admin", "teamlead"),
  c.assignProject,
);
router.get("/all", verifyToken, c.getProjects);
router.get("/:id", verifyToken, c.getSingleProject);
router.put("/:id", verifyToken, c.updateProject);
router.delete("/:id", verifyToken, c.deleteProject);
module.exports = router;
