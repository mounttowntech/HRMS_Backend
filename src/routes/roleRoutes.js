const router = require("express").Router();
const c = require("../controllers/roleController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/create",
  verifyToken,
  allowRoles("employer", "admin"),
  c.createOrUpdateRole,
);
router.get("/all", verifyToken, allowRoles("employer", "admin", "hr"), c.getRoles);
router.get(
  "/:id",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.getRoleById
);
module.exports = router;
