const express = require("express");
const router = express.Router();

const {
  createTask,
  updateTaskStatus,
  getMyTasks,
  getAllTasks,
} = require("../controllers/taskControllers");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post(
  "/create",
  verifyToken,
  allowRoles("Team Lead", "Project Manager", "Admin"),
  createTask
);

router.put(
  "/status/:taskId",
  verifyToken,
  updateTaskStatus
);

router.get(
  "/my-tasks",
  verifyToken,
  getMyTasks
);

router.get(
  "/all",
  verifyToken,
  allowRoles("Team Lead", "Project Manager", "HR", "Admin"),
  getAllTasks
);

module.exports = router;