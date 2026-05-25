const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createDepartment);
router.get("/all", verifyToken, getDepartments);
router.get("/:id", verifyToken, getDepartmentById);
router.put("/:id", verifyToken, updateDepartment);
router.delete("/:id", verifyToken, deleteDepartment);

module.exports = router;