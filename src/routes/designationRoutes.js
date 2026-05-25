const express = require("express");
const router = express.Router();

const designationController = require("../controllers/designationController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post(
  "/create",
  verifyToken,
  designationController.createDesignation
);

router.get(
  "/all",
  verifyToken,
  designationController.getDesignations
);

router.get(
  "/department/:departmentId",
  verifyToken,
  designationController.getDesignationsByDepartment
);

router.put(
  "/:id",
  verifyToken,
  designationController.updateDesignation
);

router.delete(
  "/:id",
  verifyToken,
  designationController.deleteDesignation
);

module.exports = router;