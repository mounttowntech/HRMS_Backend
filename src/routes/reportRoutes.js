const router = require("express").Router();
const c = require("../controllers/reportController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.get(
  "/summary",
  verifyToken,
  allowRoles("employer", "admin", "hr", "projectmanager"),
  c.summaryReport,
);
module.exports = router;
