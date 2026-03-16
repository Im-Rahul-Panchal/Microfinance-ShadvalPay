const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const controller = require("../controllers/customerController");

router.post("/menu", authenticateToken, controller.menuList);
router.post("/dashboardData", authenticateToken, controller.dashboardData);
router.post("/verification", authenticateToken, controller.verification);
router.post("/generateAadhaarOtp", authenticateToken, controller.generateAadhaarOtp);
router.post("/verifyAadhaarOtp", authenticateToken, controller.verifyAadhaarOtp);
router.post("/personalDetails", authenticateToken, controller.personalDetails);

router.post(
  "/uploadDocuments",
  authenticateToken,
  upload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "fatherMotherAadhar", maxCount: 1 },
    { name: "otherDocuments", maxCount: 1 },
  ]),
  controller.uploadDocuments,
);

router.post("/customerProfile", authenticateToken, controller.customerProfile);
router.post("/customerDocuments", authenticateToken, controller.customerDocuments);
router.post("/customerLoanAccounts", authenticateToken, controller.customerLoanAccounts);
router.post("/customerList", authenticateToken, controller.customerList);
router.post("/clients", authenticateToken, controller.clients);

module.exports = router;
