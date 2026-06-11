const router = require("express").Router();

const {
  registerEmployer,
  login,
  resetPassword,
  changePassword,
  forgotPassword,
  verifyOtp,
  me,
  updateRoleBasedProfile,
  createRoleBasedProfile,
  getAllRoleBasedProfiles,
  getRoleBasedProfileById,
  updateRoleBasedProfileById,
  deleteRoleBasedProfileById
} = require("../controllers/authController");

const {
  verifyToken,allowRoles
} = require("../middleware/authMiddleware");

// ✅ Public routes
router.post("/register-employer", registerEmployer);
router.post("/login", login);
router.post("/reset-password", verifyToken,resetPassword);
router.post("/forgot-password", forgotPassword);


router.post("/verify-otp", verifyOtp);


router.put("/change-password", verifyToken,changePassword);
// ✅ Protected route
router.get("/me", verifyToken, me);
router.put(
  "/profile/update",
  verifyToken,
  allowRoles("admin", "hr", "teamlead", "projectmanager", "employee"),
  updateRoleBasedProfile
);
// router.post(
//   "/profiles",
//   verifyToken,
//   allowRoles("admin", "hr"),
//  createRoleBasedProfile
// );

// router.get(
//   "/profiles",
//   verifyToken,
//   allowRoles("admin", "hr"),
//  getAllRoleBasedProfiles
// );

// router.get(
//   "/profiles/:id",
//   verifyToken,
//   allowRoles("admin", "hr", "teamlead", "projectmanager", "employee"),
//   getRoleBasedProfileById
// );

// router.put(
//   "/profiles/:id",
//   verifyToken,
//   allowRoles("admin", "hr"),
//   updateRoleBasedProfileById
// );

// router.delete(
//   "/profiles/:id",
//   verifyToken,
//   allowRoles("admin"),
//   deleteRoleBasedProfileById
// );

module.exports = router;