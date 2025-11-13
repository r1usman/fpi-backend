const express = require("express");
const router = express.Router();
const { Protect } = require("../Middleware/AuthMiddleware");
const userController = require("../controllers/singleUserController.js");

// Route should include :id to match req.params.id
router.get("/stats/:id", Protect, userController.getUserStats);

module.exports = router;
