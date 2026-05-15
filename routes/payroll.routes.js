const express = require("express");
const router = express.Router();

const {
  generatePayroll,
  getMyPayslips,
  getAllPayrolls,
} = require("../controllers/payrollController");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post(
  "/generate",
  verifyToken,
  allowRoles("HR", "Admin"),
  generatePayroll
);

router.get(
  "/my-payslips",
  verifyToken,
  getMyPayslips
);

router.get(
  "/all",
  verifyToken,
  allowRoles("HR", "Admin"),
  getAllPayrolls
);

module.exports = router;