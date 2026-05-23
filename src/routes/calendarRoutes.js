const express = require("express");
const router = express.Router();

const {
  createEvent,
  getEvents,
  getHolidays,
  getAttendanceCalendar,
  getLeaveCalendar,
  deleteEvent,
} = require("../controllers/calenderController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create-events", verifyToken, createEvent);
router.get("/all", verifyToken, getEvents);
router.get("/holidays", verifyToken, getHolidays);
router.get("/attendance", verifyToken, getAttendanceCalendar);
router.get("/leaves", verifyToken, getLeaveCalendar);
router.delete("/events/:id", verifyToken, deleteEvent);

module.exports = router;