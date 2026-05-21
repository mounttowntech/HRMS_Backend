const router = require("express").Router();
const c = require("../controllers/assetController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/create",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createAsset,
);
router.patch(
  "/assign/:id",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.assignAsset,
);
router.post(
  "/access/create",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createAccess,
);
router.get(
  "/all",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.getAllAssets,
);
router.get(
  "/all-access",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.getAllAccess,
);
module.exports = router;
