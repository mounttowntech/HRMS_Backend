const router = require("express").Router();

const {
  registerEmployer,
  login,
  resetPassword,
  changePassword,
  me,
} = require("../controllers/authController");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

// ✅ Public routes
router.post("/register-employer", registerEmployer);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.put("/change-password", verifyToken,changePassword);
// ✅ Protected route
router.get("/me", verifyToken, me);

module.exports = router;