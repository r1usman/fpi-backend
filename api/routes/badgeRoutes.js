const express = require("express");
const router = express.Router();
const { markProblemSolved } = require("../controllers/submissionController");
const auth = require("../middleware/authMiddleware");

router.post("/solve", auth, markProblemSolved);

module.exports = router;
