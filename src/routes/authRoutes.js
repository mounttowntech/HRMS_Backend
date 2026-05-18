const router = require("express").Router();
const c = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
router.post("/register-employer", c.registerEmployer);
router.post("/login", c.login);
router.get("/me", verifyToken, c.me);
module.exports = router;
