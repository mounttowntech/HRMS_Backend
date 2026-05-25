const express = require("express");
const router = express.Router();

const {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createRole);
router.get("/all", verifyToken, getRoles);
router.get("/:id", verifyToken, getRoleById);
router.put("/:id", verifyToken, updateRole);
router.delete("/:id", verifyToken, deleteRole);

module.exports = router;