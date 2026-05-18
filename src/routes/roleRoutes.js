const router = require("express").Router();
const c = require("../controllers/roleController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/",
  verifyToken,
  allowRoles("employer", "admin"),
  c.createOrUpdateRole,
);
router.get("/", verifyToken, allowRoles("employer", "admin", "hr"), c.getRoles);
module.exports = router;
