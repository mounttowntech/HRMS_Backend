const router = require("express").Router();
const c = require("../controllers/payrollController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/process",
  verifyToken,
  allowRoles("admin", "hr"),
  c.processPayroll,
);
router.patch(
  "/:id/generate-payslip",
  verifyToken,
  allowRoles("admin", "hr"),
  c.generatePayslip,
);
router.patch(
  "/:id/publish",
  verifyToken,
  allowRoles("admin", "hr"),
  c.publishPayslip,
);
router.get("/:id/download", verifyToken, c.downloadPayslip);
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr"),
  c.getPayrolls,
);
module.exports = router;
