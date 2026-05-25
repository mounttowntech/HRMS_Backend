const express = require("express");
const router = express.Router();

const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");

const { verifyToken,  allowRoles } = require("../middleware/authMiddleware");


router.post(
  "/create",
  verifyToken,
  allowRoles("admin", "hr", "projectmanager"),
  createClient
);

router.get(
  "/all",
  verifyToken,
  allowRoles("admin", "hr", "projectmanager", "teamlead"),
  getClients
);

router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "hr", "projectmanager", "teamlead"),
  getClientById
);

router.put(
  "/update/:id",
  verifyToken,
  allowRoles("admin", "projectmanager"),
  updateClient
);

router.delete(
  "/delete/:id",
  verifyToken,
  allowRoles("admin"),
  deleteClient
);

module.exports = router;