const router = require("express").Router();
const taskController = require("../controllers/taskController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.post(
  "/assign",
  verifyToken,
  allowRoles("admin", "hr", "teamlead", "projectmanager"),
  taskController.createTask
);

router.get(
  "/all",
  verifyToken,
  taskController.getTasks
);

router.get(
  "/:id",
  verifyToken,
  taskController.getTaskById
);

router.get(
  "/project/:projectId",
  verifyToken,
  taskController.getTasksByProject
);
router.put(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "teamlead", "projectmanager"),
  taskController.updateTask
);

router.patch(
  "/:id/status",
  verifyToken,
  taskController.updateTaskStatus
);

router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "teamlead", "projectmanager"),
  taskController.deleteTask
);

module.exports = router;