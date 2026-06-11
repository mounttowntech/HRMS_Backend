const express = require("express");
const router = express.Router();

const {
  processPayroll,
  getPayrollDashboard,
  getEmployeePayslip,
} = require("../controllers/payrollController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/process", verifyToken, processPayroll);
router.get("/dashboard", verifyToken, getPayrollDashboard);
router.get("/:payrollId/employee/:employeeId/payslip", verifyToken, getEmployeePayslip);

module.exports = router;