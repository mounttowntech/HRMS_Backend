const express = require("express");
const router = express.Router();

const {
  processPayroll,
  getAllPayrolls,
  getPayrollById,
  getPayrollDashboard,
  getEmployeePayslip,
  downloadEmployeePayslip,
  sendEmployeePayslipMail,
  getMyPayslips,
  deletePayroll,
} = require("../controllers/payrollController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/process",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  processPayroll
);

router.get(
  "/dashboard",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  getPayrollDashboard
);

router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  getAllPayrolls
);
router.get(
  "/my-payslip",
  verifyToken,
  allowRoles("employee", "teamlead", "projectmanager", "hr"),
  getMyPayslips
);
router.get(
  "/:payrollId/employee/:employeeId/payslip",
  verifyToken,
  allowRoles("admin", "hr", "employee", "teamlead", "projectmanager"),
  getEmployeePayslip
);

router.get(
  "/:payrollId/employee/:employeeId/download",
  verifyToken,
  allowRoles("admin", "hr","employee", "teamlead", "projectmanager"),
  downloadEmployeePayslip
);

router.post(
  "/:payrollId/employee/:employeeId/send-mail",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  sendEmployeePayslipMail
);

router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee","teamlead","projectmanager"),
  getPayrollById
);


router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  deletePayroll
);

module.exports = router;