const router = require("express").Router();
const c = require("../controllers/assetController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createAsset,
);
router.patch(
  "/:id/assign",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.assignAsset,
);
router.post(
  "/access",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createAccess,
);
router.get(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.getAssets,
);
module.exports = router;
