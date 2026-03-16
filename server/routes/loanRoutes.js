const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/branch", authenticateToken, loanController.branchList);
router.post("/center", authenticateToken, loanController.centerList);
router.post("/group", authenticateToken, loanController.groupList);
router.post("/loanType", authenticateToken, loanController.loanTypeList);
router.post("/scheme", authenticateToken, loanController.schemeList);
router.post("/guarantor", authenticateToken, loanController.guarantorList);
router.post("/pincode", authenticateToken, loanController.pincodeDetails);
router.post("/ifsc", authenticateToken, loanController.ifscDetails);
router.post("/applyNewLoan", authenticateToken, loanController.applyNewLoan);
router.post("/collectionReport", authenticateToken, loanController.collectionReport);
router.post("/loanReport", authenticateToken, loanController.loanReport);
router.post("/associateProfile", authenticateToken, loanController.associateProfile);
router.post("/loanProfile", authenticateToken, loanController.loanProfile);
router.post("/loanLedger", authenticateToken, loanController.loanLedger);

module.exports = router;
