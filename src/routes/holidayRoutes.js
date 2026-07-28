const express = require("express");
const router = express.Router();

const {
  createHoliday,
  getAllHolidays,
  getHolidayById,
  getUpcomingHolidays,
  updateHoliday,
  deleteHoliday,
  getPaidHolidays,
  getHolidayByMonth,
} = require("../controllers/holidayController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

// ==========================================
// CREATE HOLIDAY
// ==========================================

router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "hr"),
  createHoliday
);

// ==========================================
// GET ALL HOLIDAYS
// ==========================================

router.get(
  "/all",
  verifyToken,
  getAllHolidays
);

// ==========================================
// GET UPCOMING HOLIDAYS
// ==========================================

router.get(
  "/upcoming",
  verifyToken,
  getUpcomingHolidays
);

// ==========================================
// GET PAID HOLIDAYS
// ==========================================

router.get(
  "/paid",
  verifyToken,
  allowRoles("admin", "hr"),
  getPaidHolidays
);

// ==========================================
// GET HOLIDAYS BY MONTH
// Example:
// /api/holiday/month?month=7&year=2026
// ==========================================

router.get(
  "/month",
  verifyToken,
  getHolidayByMonth
);

// ==========================================
// GET HOLIDAY BY ID
// ==========================================

router.get(
  "/:id",
  verifyToken,
  getHolidayById
);

// ==========================================
// UPDATE HOLIDAY
// ==========================================

router.put(
  "/update/:id",
  verifyToken,
  allowRoles("admin", "hr"),
  updateHoliday
);

// ==========================================
// DELETE HOLIDAY
// ==========================================

router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("admin"),
  deleteHoliday
);

module.exports = router;