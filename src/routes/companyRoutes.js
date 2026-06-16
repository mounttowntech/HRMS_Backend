const express = require("express");
const router = express.Router();

const {
  createCompany,
  getCompanies,
  getSingleCompany,
  updateCompany,
  deleteCompany,
} = require("../controllers/companyController");

const { verifyToken , allowRoles } = require("../middleware/authMiddleware");


// CREATE COMPANY
router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "hr", "employee"),
  createCompany
);

// GET ALL COMPANIES
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employee"),
  getCompanies
);

// GET COMPANY BY ID
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee"),
  getSingleCompany
);

// UPDATE COMPANY
router.put(
  "/update/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee"),
  updateCompany
);


// DELETE COMPANY
router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee"),
  deleteCompany
);

module.exports = router;