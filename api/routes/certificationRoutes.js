const express = require("express");
const router = express.Router();
const { checkAndAwardCertification } = require("../controllers/certificationController");
const auth = require("../middleware/authMiddleware");

router.post("/check", auth, checkAndAwardCertification);

module.exports = router;
