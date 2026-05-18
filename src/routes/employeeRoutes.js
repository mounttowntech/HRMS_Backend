const router = require("express").Router();
const c = require("../controllers/employeeController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createEmployee,
);
router.post(
  "/:employeeId/create-login",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createEmployeeLogin,
);
router.get(
  "/",
  verifyToken,
  allowRoles("employer", "admin", "hr", "teamlead", "projectmanager"),
  c.getEmployees,
);
router.get("/:id", verifyToken, c.getEmployeeById);
router.put(
  "/:id",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.updateEmployee,
);
module.exports = router;
