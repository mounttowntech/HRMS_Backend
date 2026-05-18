const router = require("express").Router();
const c = require("../controllers/companyController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post("/", verifyToken, allowRoles("employer", "admin"), c.createCompany);
router.get("/my-company", verifyToken, c.getMyCompany);
router.put(
  "/my-company",
  verifyToken,
  allowRoles("employer", "admin"),
  c.updateCompany,
);
module.exports = router;
