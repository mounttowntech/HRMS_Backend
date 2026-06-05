const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = "uploads/onboarding";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      file.fieldname +
      "-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, JPG, JPEG and PNG files are allowed"), false);
  }

  cb(null, true);
};

const uploadOnboardingDocs = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).fields([
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "tenth_marksheet", maxCount: 1 },
  { name: "twelfth_marksheet", maxCount: 1 },
  { name: "experience_letter", maxCount: 1 },
  { name: "three_month_salary_slip", maxCount: 1 },
]);

module.exports = uploadOnboardingDocs;