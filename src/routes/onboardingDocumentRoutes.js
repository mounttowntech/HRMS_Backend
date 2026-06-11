const express = require("express");
const router = express.Router();

const {
  uploadAllOnboardingDocuments,
  getEmployeeOnboardingDocuments,
  verifySingleOnboardingDocument,
} = require("../controllers/onboardingDocument");

const uploadOnboardingDocuments = require("../middleware/uploadOnboardingDocs");
const { verifyToken } = require("../middleware/authMiddleware");

router.post(
  "/upload/:employeeId",
  verifyToken,
  uploadOnboardingDocuments.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "tenthMarksheet", maxCount: 1 },
    { name: "twelfthMarksheet", maxCount: 1 },
    { name: "experienceLetter", maxCount: 1 },
    { name: "salarySlip", maxCount: 1 },
  ]),
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