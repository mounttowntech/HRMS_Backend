const router = require("express").Router();
const c = require("../controllers/companyController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post("/create", verifyToken, allowRoles("employer", "admin"), c.createCompany);
router.get("/my-company", verifyToken, c.getCompanies);
router.get("/:id", verifyToken, c.getSingleCompany);
router.put(
  "/:id",
  verifyToken,
  allowRoles("employer", "admin"),
  c.updateCompany,
);
router.delete(
  "/:id",
  verifyToken,
  allowRoles("employer", "admin"),
  c.deleteCompany,
);
module.exports = router;
