const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const { verifyToken } = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/upload");

router.post(
  "/create",
  verifyToken,
  profileUpload.single("profileImage"),
  employeeController.createEmployee
);

router.get("/all", verifyToken, employeeController.getEmployees);
router.get("/:id", verifyToken, employeeController.getEmployeeById);

router.put(
  "/:id",
  verifyToken,
  profileUpload.single("profileImage"),
  employeeController.updateEmployee
);

router.delete("/:id", verifyToken, employeeController.deleteEmployee);

module.exports = router;