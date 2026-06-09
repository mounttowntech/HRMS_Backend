const router = require("express").Router();
const c = require("../controllers/reportController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.get(
  "/summary",
  verifyToken,
  allowRoles("admin", "hr", "projectmanager", "teamlead"),
  c.summaryReport
);

module.exports = router;