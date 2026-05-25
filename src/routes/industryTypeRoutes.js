const express = require("express");

const router = express.Router();

const {
  createIndustryType,
  getIndustryTypes,
  getSingleIndustryType,
  updateIndustryType,
  deleteIndustryType,
} = require("../controllers/industryTypeController");

const { verifyToken } = require("../middleware/authMiddleware");


// ======================================
// CREATE INDUSTRY TYPE
// ======================================
router.post(
  "/create",
  verifyToken,
  createIndustryType
);

// ======================================
// GET ALL INDUSTRY TYPES
// ======================================
router.get(
  "/all",
  verifyToken,
  getIndustryTypes
);

// ======================================
// GET SINGLE INDUSTRY TYPE
// ======================================
router.get(
  "/:id",
  verifyToken,
  getSingleIndustryType
);

// ======================================
// UPDATE INDUSTRY TYPE
// ======================================
router.put(
  "/update/:id",
  verifyToken,
  updateIndustryType
);

// ======================================
// DELETE INDUSTRY TYPE
// ======================================
router.delete(
  "/delete/:id",
  verifyToken,
  deleteIndustryType
);

module.exports = router;