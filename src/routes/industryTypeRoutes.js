const express = require("express");
const router = express.Router();

const {
  createIndustryType,
  getIndustryTypes,
  getIndustryTypeById,
  updateIndustryType,
  deleteIndustryType,
} = require("../controllers/industryTypeController");

const { verifyToken , allowRoles } = require("../middleware/authMiddleware");

router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "hr", "projectmanager"),
  createIndustryType
);

router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "projectmanager", "teamlead"),
  getIndustryTypes
);
router.get(
  "/:id",
  verifyToken,
  allowRoles(
    "admin",
    "hr",
    "projectmanager",
    "teamlead"
  ),
  getIndustryTypeById
);
router.put(
  "/update/:id",
  verifyToken,
  allowRoles("admin", "projectmanager"),
  updateIndustryType
);

router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("admin"),
  deleteIndustryType
);

module.exports = router;