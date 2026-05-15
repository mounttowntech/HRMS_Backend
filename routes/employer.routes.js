const express = require("express");
const router = express.Router();

const {
  createEmployer,
  getAllEmployers,
  getEmployerById,
  updateEmployer,
  deleteEmployer,
  changeEmployerStatus,
} = require("../controllers/employerControllers");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

// Admin only creates employer/company
router.post(
  "/create",
  verifyToken,
  allowRoles("Admin"),
  createEmployer
);

// Admin and HR can view employers
router.get(
  "/all",
  verifyToken,
  allowRoles("Admin", "HR"),
  getAllEmployers
);

router.get(
  "/:employerId",
  verifyToken,
  allowRoles("Admin", "HR"),
  getEmployerById
);

// Admin only updates employer
router.put(
  "/update/:employerId",
  verifyToken,
  allowRoles("Admin"),
  updateEmployer
);

// Admin only changes status
router.put(
  "/status/:employerId",
  verifyToken,
  allowRoles("Admin"),
  changeEmployerStatus
);

// Admin only deletes employer
router.delete(
  "/delete/:employerId",
  verifyToken,
  allowRoles("Admin"),
  deleteEmployer
);

module.exports = router;