const router = require("express").Router();
const c = require("../controllers/payrollController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/process",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.processPayroll,
);
router.patch(
  "/:id/generate-payslip",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.generatePayslip,
);
router.patch(
  "/:id/publish",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.publishPayslip,
);
router.get("/:id/download", verifyToken, c.downloadPayslip);
router.get(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.getPayrolls,
);
module.exports = router;
