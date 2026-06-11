const express = require("express");
const router = express.Router();

const {
  processPayroll,
  getAllPayrolls,
  getPayrollById,
  getPayrollDashboard,
  getEmployeePayslip,
} = require("../controllers/payrollController");

const { verifyToken ,allowRoles} = require("../middleware/authMiddleware");

router.post("/process", verifyToken, processPayroll);
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  getAllPayrolls
);
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  getPayrollById
);
router.get("/dashboard", verifyToken, getPayrollDashboard);
router.get("/:payrollId/employee/:employeeId/payslip", verifyToken, getEmployeePayslip);

module.exports = router;