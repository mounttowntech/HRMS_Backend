const express = require("express");
const router = express.Router();

const { getReportsSummary } = require("../controllers/reportController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/summary", verifyToken, getReportsSummary);

module.exports = router;