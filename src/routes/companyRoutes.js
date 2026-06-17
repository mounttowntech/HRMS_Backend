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
  allowRoles("admin"),
  createCompany
);

// GET ALL COMPANIES
router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "employee","teamlead","projectmanager"),
  getCompanies
);

// GET COMPANY BY ID
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee","teamlead","projectmanager"),
  getSingleCompany
);

// UPDATE COMPANY
router.put(
  "/update/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee","teamlead","projectmanager"),
  updateCompany
);


// DELETE COMPANY
router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("admin", "hr", "employee","teamlead","projectmanager"),
  deleteCompany
);

module.exports = router;