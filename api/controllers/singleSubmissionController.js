// controllers/singleSubmissionController.js
const User = require('../models/user.model'); // adjust path if needed
const Problem = require('../models/SingleProblem');
const AiProblem = require('../models/aiProblem');
const Submission = require('../models/SingleSubmission');
const axios = require('axios');
const mongoose = require('mongoose');

const JUDGE0_API = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.J0_API;

// Language mapping for Judge0
const languageMap = {
  python: 71,
  java: 62,
  javascript: 63,
  cpp: 54,
};


// exports.createSubmission = async (req, res) => {
//   try {
//     const { language, version, code, problemId, startedAt, endedAt, elapsedTimeMs, isAiProblem } = req.body;

//     console.log("Received submission:", { language, version, problemId, isAiProblem });

//     // Fetch the problem (either regular or AI)
//     let problem;
//     let problemModel;
    
//     if (isAiProblem) {
//       const AiProblem = require('../models/aiProblem'); // Add this import at top
//       problem = await AiProblem.findById(problemId);
//       problemModel = 'aiProblem';
//       console.log("Fetching AI Problem");
//     } else {
//       problem = await Problem.findById(problemId);
//       problemModel = 'Problem';
//       console.log("Fetching Regular Problem");
//     }

//     if (!problem) {
//       return res.status(404).json({ message: "Problem not found" });
//     }

//     const testcases = problem.examples || [];
    
//     if (testcases.length === 0) {
//       return res.status(400).json({ 
//         message: "No test cases available for this problem" 
//       });
//     }

//     let allPassed = true;
//     let results = [];
//     let totalExecutionTime = 0;

//     for (const tc of testcases) {
//       try {
//         // Get Judge0 language ID
//         const languageId = languageMap[language.toLowerCase()];
//         if (!languageId) {
//           throw new Error(`Language ${language} not supported`);
//         }

//         // Normalize input
//         let stdinValue;
//         if (Array.isArray(tc.input)) {
//           stdinValue = tc.input.map(v => String(v).trim()).join("\n");
//         } else {
//           stdinValue = String(tc.input).trim();
//         }

//         // Submit to Judge0
//         const apiRes = await axios.post(
//           `${JUDGE0_API}/submissions?wait=true`,
//           {
//             language_id: languageId,
//             source_code: code,
//             stdin: stdinValue,
//             expected_output: String(tc.output || "").trim()
//           },
//           {
//             headers: {
//               "Content-Type": "application/json",
//               "X-RapidAPI-Key": RAPIDAPI_KEY,
//               "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
//             }
//           }
//         );

//         const submission = apiRes.data;
//         const output = (submission.stdout || "").trim();
//         const expected = (tc.output || "").trim();
//         const passed = output === expected;

//         if (!passed) allPassed = false;

//         results.push({
//           input: tc.input,
//           expected,
//           output,
//           passed,
//           executionTime: submission.time ?? null,
//           memory: submission.memory ?? null,
//           statusDescription: submission.status?.description,
//           error: submission.stderr || submission.compile_output || submission.message || null,
//         });

//         if (submission.time) {
//           const execTimeNum = parseFloat(submission.time);
//           if (!isNaN(execTimeNum)) totalExecutionTime += execTimeNum;
//         }

//       } catch (error) {
//         allPassed = false;
//         results.push({
//           input: tc.input,
//           expected: tc.output || "",
//           output: "",
//           passed: false,
//           executionTime: null,
//           memory: null,
//           statusDescription: "Error",
//           error: error.message,
//         });
//       }
//     }

//     const status = allPassed ? "accepted" : "rejected";

//     // Compute elapsedTimeMs if not provided
//     let computedElapsedMs = typeof elapsedTimeMs === "number" ? elapsedTimeMs : undefined;
//     if ((computedElapsedMs === undefined) && startedAt && endedAt) {
//       const s = new Date(startedAt);
//       const e = new Date(endedAt);
//       if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e.getTime() >= s.getTime()) {
//         computedElapsedMs = e.getTime() - s.getTime();
//       }
//     }

//     // Create submission
//     const newSubmission = await Submission.create({
//       language,
//       version,
//       code,
//       note: req.body.note || "",
//       status,
//       results,
//       user: req.user._id,
//       problem: problemId,
//       problemType: problemModel, // Add this to track problem type
//       startedAt: startedAt ? new Date(startedAt) : undefined,
//       endedAt: endedAt ? new Date(endedAt) : undefined,
//       elapsedTimeMs: computedElapsedMs,
//       executionTime: totalExecutionTime || undefined,
//     });

//     // ====== Update user stats (only for regular problems, not AI) ======
//     if (!isAiProblem && status === "accepted") {
//       const user = await User.findById(req.user._id);
//       if (user) {
//         user.submissions = user.submissions || [];
//         user.submissions.push(newSubmission._id);

//         // Check if problem already solved
//         const probIdStr = problem._id.toString();
//         const alreadySolved = (user.solvedProblems || []).some(id => id.toString() === probIdStr);

//         console.log("Problem ID:", probIdStr);
//         console.log("Already solved?", alreadySolved);
//         console.log("Problem difficulty:", problem.difficulty);

//         if (!alreadySolved) {
//           // Add to solvedProblems
//           user.solvedProblems = user.solvedProblems || [];
//           user.solvedProblems.push(problem._id);

//           // Initialize solvedCounts if not present
//           user.solvedCounts = user.solvedCounts || {
//             EASY: 0,
//             MEDIUM: 0,
//             MEDIUM_HARD: 0,
//             HARD: 0,
//             VERY_HARD: 0
//           };

//           // Get problem difficulty and increment the count
//           const difficulty = problem.difficulty;
//           console.log("Incrementing difficulty:", difficulty);

//           if (difficulty && user.solvedCounts.hasOwnProperty(difficulty)) {
//             user.solvedCounts[difficulty] = (user.solvedCounts[difficulty] || 0) + 1;
//             console.log("New count for", difficulty, ":", user.solvedCounts[difficulty]);
//           }

//           // Increment totalSolved
//           user.totalSolved = (user.totalSolved || 0) + 1;
//           console.log("New totalSolved:", user.totalSolved);
//         }

//         // Update preferredTags
//         user.preferredTags = user.preferredTags || [];
//         user.preferredTags = user.preferredTags.map(t =>
//           typeof t === "string" ? { tag: t, count: 1 } : t
//         );

//         const problemTags = Array.isArray(problem.tags) ? problem.tags : [];
//         for (const tag of problemTags) {
//           const idx = user.preferredTags.findIndex(
//             t => t.tag.toLowerCase() === tag.toLowerCase()
//           );
//           if (idx === -1) {
//             user.preferredTags.push({ tag, count: 1 });
//           } else {
//             user.preferredTags[idx].count = (user.preferredTags[idx].count || 0) + 1;
//           }
//         }

//         // Recalculate preferred difficulty
//         const difficultyMap = { EASY: 1, MEDIUM: 2, MEDIUM_HARD: 3, HARD: 4, VERY_HARD: 5 };
//         const reverseMap = { 1: "EASY", 2: "MEDIUM", 3: "MEDIUM_HARD", 4: "HARD", 5: "VERY_HARD" };

//         const solvedIds = (user.solvedProblems || []).map(
//           id => new mongoose.Types.ObjectId(id)
//         );
//         if (solvedIds.length > 0) {
//           const solvedDocs = await Problem.find(
//             { _id: { $in: solvedIds } },
//             "difficulty"
//           ).lean();
//           const totalScore = solvedDocs.reduce((sum, p) => {
//             const d = p && p.difficulty ? difficultyMap[p.difficulty] || 1 : 1;
//             return sum + d;
//           }, 0);
//           const avg = totalScore / solvedDocs.length;
//           const rounded = Math.round(avg);
//           user.preferredDifficulty = reverseMap[rounded] || user.preferredDifficulty || "EASY";
//         }

//         console.log("User before save:", {
//           solvedProblems: user.solvedProblems?.length,
//           solvedCounts: user.solvedCounts,
//           totalSolved: user.totalSolved,
//           preferredTags: user.preferredTags
//         });

//         await user.save();
//         console.log("User saved successfully.");
//       }
//     } else if (isAiProblem && status === "accepted") {
//       // For AI problems, just add to submissions but don't update stats
//       const user = await User.findById(req.user._id);
//       if (user) {
//         user.submissions = user.submissions || [];
//         user.submissions.push(newSubmission._id);
//         await user.save();
//         console.log("AI problem submission saved (stats not updated).");
//       }
//     }

//     return res.status(201).json({ newSubmission });
//   } catch (err) {
//     console.error("createSubmission error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

// =========== 4
// =========== FIXED createSubmission =============
// exports.createSubmission = async (req, res) => {
//   try {
//     console.log("========== SUBMISSION REQUEST START ==========");
//     console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
//     console.log("👤 User ID:", req.user?._id);

//     const { language, version, code, problemId, startedAt, endedAt, elapsedTimeMs, isAiProblem } = req.body;

//     console.log("🔍 Extracted Values:");
//     console.log("  - Language:", language);
//     console.log("  - Version:", version);
//     console.log("  - Problem ID:", problemId);
//     console.log("  - Is AI Problem:", isAiProblem);

//     // ======================================================
//     // 🧩 1. FETCH PROBLEM (Corrected: NO duplicates)
//     // ======================================================
//     let problem = null;
//     let problemModel = null;

//     console.log("\n🔎 Auto-detecting problem model…");

//     if (isAiProblem) {
//       problem = await AiProblem.findById(problemId);
//       if (problem) {
//         problemModel = "AiProblem";
//       } else {
//         // fallback
//         problem = await Problem.findById(problemId);
//         if (problem) problemModel = "SingleProblem";
//       }
//     } else {
//       problem = await Problem.findById(problemId);
//       if (problem) {
//         problemModel = "SingleProblem";
//       } else {
//         // fallback
//         problem = await AiProblem.findById(problemId);
//         if (problem) problemModel = "AiProblem";
//       }
//     }

//     if (!problem) {
//       console.log("❌ Problem not found.");
//       return res.status(404).json({ message: "Problem not found" });
//     }

//     console.log(`  ✅ Problem Found in Model: ${problemModel}`);
//     console.log("  - Problem Name:", problem.name);
//     console.log("  - Difficulty:", problem.difficulty);

//     // ======================================================
//     // 🧪 2. GET TEST CASES
//     // ======================================================
//     const testcases = problem.examples || [];
//     console.log("\n🧪 Total Test Cases:", testcases.length);

//     if (testcases.length === 0) {
//       return res.status(400).json({ message: "No test cases available for this problem" });
//     }

//     // ======================================================
//     // 🚀 3. RUN TEST CASES WITH JUDGE0
//     // ======================================================
//     let allPassed = true;
//     let results = [];
//     let totalExecutionTime = 0;

//     for (let i = 0; i < testcases.length; i++) {
//       const tc = testcases[i];

//       try {
//         const languageId = languageMap[language.toLowerCase()];
//         if (!languageId) throw new Error(`Unsupported language: ${language}`);

//         let stdinValue = Array.isArray(tc.input)
//           ? tc.input.map(v => String(v).trim()).join("\n")
//           : String(tc.input).trim();

//         const apiRes = await axios.post(
//           `${JUDGE0_API}/submissions?wait=true`,
//           {
//             language_id: languageId,
//             source_code: code,
//             stdin: stdinValue,
//             expected_output: String(tc.output || "").trim()
//           },
//           {
//             headers: {
//               "Content-Type": "application/json",
//               "X-RapidAPI-Key": RAPIDAPI_KEY,
//               "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
//             }
//           }
//         );

//         const submission = apiRes.data;
//         const output = (submission.stdout || "").trim();
//         const expected = (tc.output || "").trim();
//         const passed = output === expected;

//         if (!passed) allPassed = false;

//         results.push({
//           input: tc.input,
//           expected,
//           output,
//           passed,
//           executionTime: submission.time ?? null,
//           memory: submission.memory ?? null,
//           statusDescription: submission.status?.description,
//           error: submission.stderr || submission.compile_output || null,
//         });

//         const execTimeNum = parseFloat(submission.time);
//         if (!isNaN(execTimeNum)) totalExecutionTime += execTimeNum;

//       } catch (error) {
//         allPassed = false;
//         results.push({
//           input: tc.input,
//           expected: tc.output,
//           output: "",
//           passed: false,
//           executionTime: null,
//           memory: null,
//           statusDescription: "Error",
//           error: error.message,
//         });
//       }
//     }

//     const status = allPassed ? "accepted" : "rejected";

//     // ======================================================
//     // ⏱ 4. CALCULATE elapsedTime
//     // ======================================================
//     let computedElapsedMs =
//       typeof elapsedTimeMs === "number"
//         ? elapsedTimeMs
//         : startedAt && endedAt
//         ? new Date(endedAt).getTime() - new Date(startedAt).getTime()
//         : undefined;

//     // ======================================================
//     // 💾 5. SAVE SUBMISSION
//     // ======================================================
//     const newSubmission = await Submission.create({
//       language,
//       version,
//       code,
//       note: req.body.note || "",
//       status,
//       results,
//       user: req.user._id,
//       problem: problemId,
//       problemType: problemModel,
//       startedAt: startedAt ? new Date(startedAt) : undefined,
//       endedAt: endedAt ? new Date(endedAt) : undefined,
//       elapsedTimeMs: computedElapsedMs,
//       executionTime: totalExecutionTime || undefined,
//     });

//     // ======================================================
//     // 👤 6. UPDATE USER STATS
//     // ======================================================
//     const user = await User.findById(req.user._id);
//     if (user) {
//       user.submissions = user.submissions || [];
//       user.submissions.push(newSubmission._id);

//       // Only update stats for NORMAL problems
//       if (!isAiProblem && status === "accepted") {
//         const probIdStr = problem._id.toString();
//         const alreadySolved = (user.solvedProblems || []).includes(probIdStr);

//         if (!alreadySolved) {
//           // add solved record
//           user.solvedProblems = user.solvedProblems || [];
//           user.solvedProblems.push(problem._id);

//           // setup default if missing
//           user.solvedCounts = user.solvedCounts || {
//             EASY: 0,
//             MEDIUM: 0,
//             MEDIUM_HARD: 0,
//             HARD: 0,
//             VERY_HARD: 0
//           };

//           const difficulty = problem.difficulty;
//           if (difficulty && user.solvedCounts[difficulty] != null) {
//             user.solvedCounts[difficulty] += 1;
//           }

//           user.totalSolved = (user.totalSolved || 0) + 1;

//           // ---- preferred difficulty recalc ----
//           const solvedIds = user.solvedProblems.map(id => new mongoose.Types.ObjectId(id));

//           const solvedDocs = await Problem.find(
//             { _id: { $in: solvedIds } },
//             "difficulty"
//           ).lean();

//           const difficultyMap = { EASY: 1, MEDIUM: 2, MEDIUM_HARD: 3, HARD: 4, VERY_HARD: 5 };
//           const reverseMap = { 1: "EASY", 2: "MEDIUM", 3: "MEDIUM_HARD", 4: "HARD", 5: "VERY_HARD" };

//           const totalScore = solvedDocs.reduce((sum, p) => sum + (difficultyMap[p.difficulty] || 1), 0);
//           const rounded = Math.round(totalScore / solvedDocs.length);

//           user.preferredDifficulty = reverseMap[rounded] || "EASY";
//         }

//         // update tags
//         user.preferredTags = user.preferredTags || [];
//         const problemTags = Array.isArray(problem.tags) ? problem.tags : [];

//         for (const tag of problemTags) {
//           const existing = user.preferredTags.find(t => t.tag.toLowerCase() === tag.toLowerCase());
//           if (existing) {
//             existing.count += 1;
//           } else {
//             user.preferredTags.push({ tag, count: 1 });
//           }
//         }
//       }

//       await user.save();
//     }

//     console.log("========== SUBMISSION REQUEST END ==========");
//     return res.status(201).json({ newSubmission });

//   } catch (err) {
//     console.error("❌ Critical error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };


// ================================================ New

exports.createSubmission = async (req, res) => {
  try {

    // --- 0. Extract incoming data
    const { language, version, code, problemId, startedAt, endedAt, elapsedTimeMs, isAiProblem } = req.body;
    console.log("Received submission:", { language, version, problemId, isAiProblem, user: req.user?._id });

    // --- 1. Fetch the problem and set a canonical problemModel string
    // We'll use "AiProblem" and "SingleProblem" as canonical names.
    let problem = null;
    let problemModel = null;

    if (isAiProblem) {
      // Prefer AiProblem when flagged
      problem = await AiProblem.findById(problemId);
      if (problem) {
        problemModel = "AiProblem";
        console.log("Found problem in AiProblem model");
      } else {
        // Fallback: maybe it's actually a regular problem id
        problem = await Problem.findById(problemId);
        if (problem) {
          problemModel = "SingleProblem";
          console.log("Fallback: found problem in SingleProblem model");
        }
      }
    } else {
      // Prefer SingleProblem when not flagged
      problem = await Problem.findById(problemId);
      if (problem) {
        problemModel = "SingleProblem";
        console.log("Found problem in SingleProblem model");
      } else {
        // Fallback: maybe it's an AI problem id
        problem = await AiProblem.findById(problemId);
        if (problem) {
          problemModel = "AiProblem";
          console.log("Fallback: found problem in AiProblem model");
        }
      }
    }


    if (!problem) {
      console.log("Problem not found for id:", problemId);
      return res.status(404).json({ message: "Problem not found" });
    }

    // --- 2. Gather testcases
    const testcases = problem.examples || [];
    console.log("Testcases count:", testcases.length);
    if (testcases.length === 0) {
      return res.status(400).json({ message: "No test cases available for this problem" });
    }

    // --- 3. Run testcases on Judge0
    let allPassed = true;
    const results = [];
    let totalExecutionTime = 0;

    for (const tc of testcases) {
      try {
        const languageId = languageMap[language.toLowerCase()];
        if (!languageId) throw new Error(`Unsupported language: ${language}`);

        const stdinValue = Array.isArray(tc.input)
          ? tc.input.map(v => String(v).trim()).join("\n")
          : String(tc.input ?? "").trim();

        const apiRes = await axios.post(
          `${JUDGE0_API}/submissions?wait=true`,
          {
            language_id: languageId,
            source_code: code,
            stdin: stdinValue,

            expected_output: String(tc.output ?? "").trim()
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        const submission = apiRes.data;
        const output = (submission.stdout || "").trim();
        const expected = String(tc.output ?? "").trim();
        const passed = output === expected;

        if (!passed) allPassed = false;

        results.push({
          input: tc.input,
          expected,
          output,
          passed,
          executionTime: submission.time ?? null,

          memory: submission.memory ?? null,
          statusDescription: submission.status?.description,
          error: submission.stderr || submission.compile_output || submission.message || null,

        });

        // accumulate execution time when provided
        const execTimeNum = parseFloat(submission.time);
        if (!isNaN(execTimeNum)) totalExecutionTime += execTimeNum;


      } catch (err) {
        // On any per-test error, mark as failed and record the error
        allPassed = false;
        results.push({
          input: tc.input,

          expected: tc.output ?? "",
          output: "",
          passed: false,
          executionTime: null,
          memory: null,
          statusDescription: "Error",
          error: err.message,
        });
      }
    }

    const status = allPassed ? "accepted" : "rejected";


    // --- 4. Compute elapsed time if not provided
    let computedElapsedMs = typeof elapsedTimeMs === "number" ? elapsedTimeMs : undefined;

    if (computedElapsedMs === undefined && startedAt && endedAt) {
      const s = new Date(startedAt);
      const e = new Date(endedAt);
      if (
        !isNaN(s.getTime()) &&
        !isNaN(e.getTime()) &&
        e.getTime() >= s.getTime()
      ) {
        computedElapsedMs = e.getTime() - s.getTime();
      }
    }

    // --- 5. Map problemModel to a value accepted by your Submission schema
    // You asked for "create submission no matter it is ai problem or singleproblem".
    // Option 2: force submissions into the SingleProblem enum if your schema expects that.
    // We'll store the detected model in a variable (problemModelDetected) but assign a
    // safe value to the DB field (dbProblemType) to avoid enum validation errors.
    const problemModelDetected = problemModel; // either "AiProblem" or "SingleProblem"

    // If your Submission schema's enum doesn't include "AiProblem", force it to "SingleProblem".
    // If your enum already includes "AiProblem", this mapping is harmless.
    const dbProblemType = (problemModelDetected === "AiProblem") ? "SingleProblem" : problemModelDetected;

    // --- 6. Create the submission (always create regardless of AI or regular)
    const newSubmission = await Submission.create({
      language,
      version,
      code,
      note: req.body.note || "",
      status,
      results,
      user: req.user._id,
      problem: problemId,
      // Save a db-safe value to avoid enum validation errors;
      // also keep problemModelDetected in logs so you can inspect later if needed.
      problemType: dbProblemType,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : undefined,
      elapsedTimeMs: computedElapsedMs,
      executionTime: totalExecutionTime || undefined,
    });

    console.log("Submission created, id:", newSubmission._id, "detectedModel:", problemModelDetected, "savedAs:", dbProblemType);

    // --- 7. Update user: always add submission; only change stats for non-AI accepted
    const user = await User.findById(req.user._id);
    if (user) {
      user.submissions = user.submissions || [];
      user.submissions.push(newSubmission._id);

      if (!isAiProblem && status === "accepted") {
        // (unchanged) update solvedProblems, solvedCounts, preferredTags, preferredDifficulty...
        const probIdStr = problem._id.toString();
        const alreadySolved = (user.solvedProblems || []).some(
          (id) => id.toString() === probIdStr
        );

        if (!alreadySolved) {
          user.solvedProblems = user.solvedProblems || [];
          user.solvedProblems.push(problem._id);

          user.solvedCounts = user.solvedCounts || {
            EASY: 0,
            MEDIUM: 0,
            MEDIUM_HARD: 0,
            HARD: 0,
            VERY_HARD: 0,
          };

          const difficulty = problem.difficulty;
          if (difficulty && user.solvedCounts.hasOwnProperty(difficulty)) {

            user.solvedCounts[difficulty] = (user.solvedCounts[difficulty] || 0) + 1;
          }

          user.totalSolved = (user.totalSolved || 0) + 1;

          // Recalculate preferredDifficulty
          const solvedIds = (user.solvedProblems || []).map(id => new mongoose.Types.ObjectId(id));
          if (solvedIds.length > 0) {
            const solvedDocs = await Problem.find({ _id: { $in: solvedIds } }, "difficulty").lean();
            const difficultyMap = { EASY: 1, MEDIUM: 2, MEDIUM_HARD: 3, HARD: 4, VERY_HARD: 5 };
            const reverseMap = { 1: "EASY", 2: "MEDIUM", 3: "MEDIUM_HARD", 4: "HARD", 5: "VERY_HARD" };
            const totalScore = solvedDocs.reduce((sum, p) => sum + (difficultyMap[p.difficulty] || 1), 0);
            const rounded = Math.round(totalScore / solvedDocs.length);
            user.preferredDifficulty = reverseMap[rounded] || user.preferredDifficulty || "EASY";
          }
        }

        // update preferredTags
        user.preferredTags = user.preferredTags || [];
        const problemTags = Array.isArray(problem.tags) ? problem.tags : [];
        for (const tag of problemTags) {
          const existing = user.preferredTags.find(t => t.tag.toLowerCase() === tag.toLowerCase());
          if (existing) existing.count += 1;
          else user.preferredTags.push({ tag, count: 1 });
        }
      }

      await user.save();
      console.log("User updated with submission:", newSubmission._id);
    }

    // --- 8. Return submission
    return res.status(201).json({ newSubmission });

  } catch (err) {
    console.error("createSubmission error:", err);
    return res.status(500).json({ message: err.message });
  }
};




exports.getSubmission = async (req, res) => {
  try {
    // match the correct field from your Submission schema
    const submissions = await Submission.find({ user: req.user._id }).populate(
      "problem",
      "name difficulty tags"
    );
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  console.log(submission);
  res.json(submission);
};

exports.updateSubmission = async (req, res) => {
  const { note } = req.body;

  const submission = await Submission.findById(req.params.id);
  submission.note = note;

  await submission.save();

  res.json({ message: "Updated", submission });
}