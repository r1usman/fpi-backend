const express = require("express");
const router = express.Router();
const badgeController = require("../controllers/badgeController");

const { Protect } = require("../utils/Token");

// Protected routes (require authentication)
router.get("/my-badges", Protect, badgeController.getUserBadges);

router.post("/check", Protect, badgeController.checkUserBadges);

router.get("/user/:userId", Protect, badgeController.getUserBadges);
router.post("/check/:userId", Protect, badgeController.checkUserBadges);

// Badge management routes
router.post("/seed", badgeController.seedBadges);
router.get("/all", badgeController.getAllBadges);

module.exports = router;
