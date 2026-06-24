const express = require("express");
const router = express.Router();

const {
  createHiringUpdate,
  getRecentHiringUpdates,
} = require("../controllers/hiringUpdateController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "hr"),
  createHiringUpdate
);

router.get(
  "/recent",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  getRecentHiringUpdates
);

module.exports = router;