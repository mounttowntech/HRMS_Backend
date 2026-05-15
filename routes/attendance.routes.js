const express = require("express");
const router = express.Router();

const {
  punchIn,
  punchOut,
  getMyAttendance,
  getAllAttendance,
} = require("../controllers/attendanceControllers");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post("/punch-in", verifyToken, punchIn);

router.post("/punch-out", verifyToken, punchOut);

router.get("/my-attendance", verifyToken, getMyAttendance);

router.get(
  "/all",
  verifyToken,
  allowRoles("HR", "Admin", "Team Lead", "Project Manager"),
  getAllAttendance
);

module.exports = router;