const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getAllEmployees,
  getMyProfile,
} = require("../controllers/employeeController");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post(
  "/create",
  verifyToken,
  allowRoles("HR", "Admin"),
  createEmployee
);

router.get(
  "/all",
  verifyToken,
  allowRoles("HR", "Admin", "Project Manager"),
  getAllEmployees
);

router.get(
  "/me",
  verifyToken,
  getMyProfile
);

module.exports = router;