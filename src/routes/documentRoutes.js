const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  uploadDocument,
  verifyDocument,
  getDocuments,
} = require("../controllers/documentController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post(
  "/upload",
  verifyToken,
  upload.single("document"),
  uploadDocument
);

router.put("/verify/:id", verifyToken, verifyDocument);

router.get("/all", verifyToken, getDocuments);

module.exports = router;