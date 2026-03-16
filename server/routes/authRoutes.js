const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/verifyMpin", authController.verifyMpin);
router.post("/refresh-token", authenticateToken, authController.refreshToken);

module.exports = router;
