const express = require("express");
const router = express.Router();

const {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, allowRoles("admin"), createRole);

router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr"),
  getRoles
);

router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr"),
  getRoleById
);

router.put("/", verifyToken, allowRoles("admin"), updateRole);

router.put(
  "/:id",
  verifyToken,
  allowRoles("admin","teamlead"),
  updateRole
);

router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  deleteRole
);

module.exports = router;