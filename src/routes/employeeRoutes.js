const router = require("express").Router();
const c = require("../controllers/employeeController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
router.post(
  "/create",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createEmployee,
);
router.post(
  "/create-login/:employeeId",
  verifyToken,
  allowRoles("employer", "admin", "hr"),
  c.createEmployeeLogin,
);
router.get(
  "/all",
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
