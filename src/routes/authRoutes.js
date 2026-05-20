const router = require("express").Router();

const {
  registerEmployer,
  login,
  resetPassword,
  me,
} = require("../controllers/authController");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

// ✅ Public routes
router.post("/register-employer", registerEmployer);
router.post("/login", login);
router.post("/reset-password", resetPassword);

// ✅ Protected route
router.get("/me", verifyToken, me);

module.exports = router;