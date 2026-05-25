const express = require("express");
const router = express.Router();

const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  changeCompanyStatus,
  deleteCompany,
} = require("../controllers/companyController");

const { verifyToken , allowRoles } = require("../middleware/authMiddleware");


// CREATE COMPANY
router.post(
  "/create",
  verifyToken,
  allowRoles("admin"),
  createCompany
);

// GET ALL COMPANIES
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr"),
  getAllCompanies
);

// GET COMPANY BY ID
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr"),
  getCompanyById
);

// UPDATE COMPANY
router.put(
  "/update/:id",
  verifyToken,
  allowRoles("admin"),
  updateCompany
);

// CHANGE COMPANY STATUS
router.put(
  "/status/:id",
  verifyToken,
  allowRoles("admin"),
  changeCompanyStatus
);

// DELETE COMPANY
router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("admin"),
  deleteCompany
);

module.exports = router;