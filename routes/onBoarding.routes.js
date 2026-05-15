const express = require("express");
const router = express.Router();

const {
  updateOnboardingStatus,
  uploadDocuments,
  assignSystemAccess,
  getOnboardingByEmployee,
} = require("../controllers/onboardingController");

const { verifyToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.put(
  "/status/:employeeId",
  verifyToken,
  allowRoles("HR", "Admin"),
  updateOnboardingStatus
);

router.put(
  "/upload-documents",
  verifyToken,
  allowRoles("Employee", "Team Lead", "Project Manager", "HR"),
  uploadDocuments
);

router.put(
  "/assign-access/:employeeId",
  verifyToken,
  allowRoles("Admin"),
  assignSystemAccess
);

router.get(
  "/:employeeId",
  verifyToken,
  allowRoles("HR", "Admin", "Project Manager"),
  getOnboardingByEmployee
);

module.exports = router;