const router = require("express").Router();

const {
  registerEmployer,
  login,
  resetPassword,
  changePassword,
  forgotPassword,
  verifyOtp,
  me,
} = require("../controllers/authController");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

// ✅ Public routes
router.post("/register-employer", registerEmployer);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.post("/forgot-password", forgotPassword);


router.post("/verify-otp", verifyOtp);


router.put("/change-password", verifyToken,changePassword);
// ✅ Protected route
router.get("/me", verifyToken, me);

module.exports = router;