const express = require("express");
const router = express.Router();

const shiftController = require("../controllers/shiftController");
const { verifyToken ,allowRoles} = require("../middleware/authMiddleware");

router.post("/create", verifyToken, shiftController.createShift);
router.get("/all", verifyToken, shiftController.getShifts);
router.get("/:id", verifyToken, shiftController.getShiftById);
router.put("/:id", verifyToken, shiftController.updateShift);
router.delete("/:id", verifyToken, shiftController.deleteShift);

module.exports = router;