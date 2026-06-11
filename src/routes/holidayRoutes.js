const express = require("express");
const router = express.Router();

const {
  createHoliday,
  getHolidays,
  getUpcomingHolidays,
  updateHoliday,
  deleteHoliday,
} = require("../controllers/holidayController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createHoliday);
router.get("/all", verifyToken, getHolidays);
router.get("/upcoming", verifyToken, getUpcomingHolidays);
router.put("/:id", verifyToken, updateHoliday);
router.delete("/:id", verifyToken, deleteHoliday);

module.exports = router;