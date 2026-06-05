const express = require("express");
const router = express.Router();

const {
  uploadAllOnboardingDocuments,
  getEmployeeOnboardingDocuments,
  verifySingleOnboardingDocument,
} = require("../controllers/onboardingDocument");

const uploadOnboardingDocs = require("../middleware/uploadOnboardingDocs");
const { verifyToken } = require("../middleware/authMiddleware");

router.post(
  "/upload/:employeeId",
  verifyToken,
  uploadOnboardingDocs,
  uploadAllOnboardingDocuments
);

router.get(
  "/employee/:employeeId",
  verifyToken,
  getEmployeeOnboardingDocuments
);

router.put(
  "/verify/:employeeId",
  verifyToken,
  verifySingleOnboardingDocument
);

module.exports = router;