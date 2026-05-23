const express = require("express");
const router = express.Router();

const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createAnnouncement);
router.get("/all", verifyToken, getAnnouncements);
router.put("/:id", verifyToken, updateAnnouncement);
router.delete("/:id", verifyToken, deleteAnnouncement);

module.exports = router;