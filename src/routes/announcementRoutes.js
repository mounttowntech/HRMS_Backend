const router = require("express").Router();

const c = require("../controllers/announcementController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

// CREATE ANNOUNCEMENT
router.post(
  "/",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  c.createAnnouncement
);

// GET ROLE BASED ANNOUNCEMENTS
router.get(
  "/",
  verifyToken,
  allowRoles("employee", "admin", "hr", "teamlead", "projectmanager", "employer"),
  c.getAnnouncements
);

// GET ALL ANNOUNCEMENTS
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employee"),
  c.getAllAnnouncements
);

// UPDATE ANNOUNCEMENT
router.put(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  c.updateAnnouncement
);

// DELETE ANNOUNCEMENT
router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employer"),
  c.deleteAnnouncement
);

module.exports = router;