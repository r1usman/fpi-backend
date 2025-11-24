const express = require("express");
const router = express.Router();
const {
  generateAiProblem,
  getAiProblemById,
  acceptAiProblem,
  deleteAiProblem,
  getAllAiProblems,
} = require("../controllers/aiProblemController");
const { Protect } = require("../utils/Token");

// POST    createAiProblem
router.post("/generate/:problemId", Protect, generateAiProblem);

// POST    acceptAiProblem
router.put("/accept/:problemId", Protect, acceptAiProblem);

// DELETE  deleteAiProblem
router.delete("/:problemId", Protect, deleteAiProblem);

// GET     getAllAiGeneratedProblems
router.get("/", Protect, getAllAiProblems);

// GET     getSingleAiGeneratedProblem
router.get("/:problemId", Protect, getAiProblemById);

module.exports = router;
