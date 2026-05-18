const router = require("express").Router();
const c = require("../controllers/documentController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post("/upload", verifyToken, c.uploadDocument);
router.patch(
  "/:id/verify",
  verifyToken,
  allowRoles("hr", "admin"),
  c.verifyDocument,
);
router.get("/", verifyToken, c.getDocuments);
module.exports = router;
