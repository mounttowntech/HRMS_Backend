const express = require("express");

const router = express.Router();

const {
  createPermission,
  getAllPermissions,
  getPermissionById,
  getEmployeeMonthlySummary,
  approvePermission,
  rejectPermission,
  updatePermission,
  deletePermission,
  getMyPermissions
} = require("../controllers/permissionController");

const {
  verifyToken,
  allowRoles,
} = require("../middleware/authMiddleware");

router.post(
  "/create",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  createPermission
);

router.get(
  "/all",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  getAllPermissions
);
router.get(
  "/my-permissions",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  getMyPermissions
);
router.get(
  "/monthly-summary",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  getEmployeeMonthlySummary
);

router.get(
  "/:id",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  getPermissionById
);


router.put(
  "/:id",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  updatePermission
);

router.patch(
  "/:id/approve",
  verifyToken,
  allowRoles(
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  approvePermission
);

router.patch(
  "/:id/reject",
  verifyToken,
  allowRoles(
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  rejectPermission
);

router.delete(
  "/:id",
  verifyToken,
  allowRoles(
    "employee",
    "teamlead",
    "projectmanager",
    "hr",
    "admin"
  ),
  deletePermission
);

module.exports = router;