const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, employeeController.createEmployee);

// router.post(
//   "/:employeeId/create-login",
//   verifyToken,
//   employeeController.createEmployeeLogin
// );

router.get("/all", verifyToken, employeeController.getEmployees);

router.get("/:id", verifyToken, employeeController.getEmployeeById);

router.put("/:id", verifyToken, employeeController.updateEmployee);

router.delete("/:id", verifyToken, employeeController.deleteEmployee);

module.exports = router;