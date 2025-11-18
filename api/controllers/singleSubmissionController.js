// controllers/singleSubmissionController.js
const User = require('../models/user.model'); // adjust path if needed
const Problem = require('../models/SingleProblem');
const Submission = require('../models/SingleSubmission');
const axios = require('axios');
const mongoose = require('mongoose');

exports.getSubmissionStats = async (req, res) => {

}

// =============================================================

const EXECUTE_URL = "http://localhost:2000/api/v2/execute";

// exports.runCode = async (req, res) => {
//   try {
//     const response = await axios.post("http://piston:2000/api/v2/execute", req.body);
//     res.json(response.data);
//   } catch (err) {
//     console.error("Execution error:", err.message);
//     res.status(500).json({ error: "Execution failed" });
//   }
// };


exports.createSubmission = async (req, res) => {
  try {
    const { language, version, code, problemId, startedAt, endedAt, elapsedTimeMs } = req.body;

    // validate problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const testcases = problem.examples || [];
    let allPassed = true;
    let results = [];
    let totalExecutionTime = 0;

    for (const tc of testcases) {
      try {
        const apiRes = await axios.post(EXECUTE_URL, {
          language,
          version,
          files: [
            {
              name:
                language.toLowerCase() === "java"
                  ? "Main.java"
                  : language.toLowerCase() === "python"
                    ? "main.py"
                    : language.toLowerCase() === "c++"
                      ? "main.cpp"
                      : "main.js",
              content: code,
            },
          ],
          stdin: String(tc.input),
        });

        const run = apiRes.data.run || {};
        const output = (run.stdout || "").trim();
        const expected = (tc.output || "").trim();
        const passed = output === expected;

        if (!passed) allPassed = false;

        results.push({
          input: tc.input,
          expected,
          output,
          passed,
          executionTime: run.cpu_time ?? null,
          error: run.stderr || run.compile_output || null,
        });

        if (run.cpu_time) totalExecutionTime += run.cpu_time;
      } catch (error) {
        allPassed = false;
        results.push({
          input: tc.input,
          expected: tc.output || "",
          output: "",
          passed: false,
          error: error.message,
        });
      }
    }

    const status = allPassed ? "accepted" : "rejected";

    // compute elapsedTimeMs if not provided but startedAt and endedAt are present
    let computedElapsedMs = typeof elapsedTimeMs === "number" ? elapsedTimeMs : undefined;
    if ((computedElapsedMs === undefined) && startedAt && endedAt) {
      const s = new Date(startedAt);
      const e = new Date(endedAt);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e.getTime() >= s.getTime()) {
        computedElapsedMs = e.getTime() - s.getTime();
      }
    }

    const newSubmission = await Submission.create({
      language,
      version,
      code,
      note: req.body.note || "",
      status,
      results,
      user: req.user._id,
      problem: problemId,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : undefined,
      elapsedTimeMs: computedElapsedMs,
      executionTime: totalExecutionTime || undefined,
    });

    // ====== Link submission to user and update preferences ======
    const user = await User.findById(req.user._id);
    if (user) {
      user.submissions = user.submissions || [];
      user.submissions.push(newSubmission._id);

      // --------------- 1 (original)
      // if (status === "accepted") {
      //   // --- 1) add solved problem (avoid duplicates) ---
      //   const probIdStr = problem._id.toString();
      //   const alreadySolved = (user.solvedProblems || []).some(id => id.toString() === probIdStr);
      //   if (!alreadySolved) {
      //     user.solvedProblems = user.solvedProblems || [];
      //     user.solvedProblems.push(problem._id);
      //   }

      //   // --- 2) update preferredTags as counts ---
      //   user.preferredTags = user.preferredTags || [];
      //   user.preferredTags = user.preferredTags.map(t =>
      //     typeof t === "string" ? { tag: t, count: 1 } : t
      //   );

      //   const problemTags = Array.isArray(problem.tags) ? problem.tags : [];
      //   for (const tag of problemTags) {
      //     const idx = user.preferredTags.findIndex(
      //       t => t.tag.toLowerCase() === tag.toLowerCase()
      //     );
      //     if (idx === -1) {
      //       user.preferredTags.push({ tag, count: 1 });
      //     } else {
      //       user.preferredTags[idx].count = (user.preferredTags[idx].count || 0) + 1;
      //     }
      //   }

      //   // --- 3) recalc difficulty ---
      //   const difficultyMap = { EASY: 1, MEDIUM: 2, MEDIUM_HARD: 3, HARD: 4, VERY_HARD: 5 };
      //   const reverseMap = { 1: "EASY", 2: "MEDIUM", 3: "MEDIUM_HARD", 4: "HARD", 5: "VERY_HARD" };

      //   const solvedIds = (user.solvedProblems || []).map(
      //     id => new mongoose.Types.ObjectId(id)
      //   );
      //   if (solvedIds.length > 0) {
      //     const solvedDocs = await Problem.find(
      //       { _id: { $in: solvedIds } },
      //       "difficulty"
      //     ).lean();
      //     const totalScore = solvedDocs.reduce((sum, p) => {
      //       const d = p && p.difficulty ? difficultyMap[p.difficulty] || 1 : 1;
      //       return sum + d;
      //     }, 0);
      //     const avg = totalScore / solvedDocs.length;
      //     const rounded = Math.round(avg);
      //     user.preferredDifficulty = reverseMap[rounded] || user.preferredDifficulty || "EASY";
      //   }

      //   // ===============
      // const alreadyCounted = (user.solvedProblems || []).some(
      //   id => id.toString() === probIdStr
      // );

      // // Only increment counts if this is the first time solving this problem
      // if (!alreadyCounted) {
      //   // Initialize solvedCounts if not present
      //   user.solvedCounts = user.solvedCounts || {
      //     EASY: 0,
      //     MEDIUM: 0,
      //     MEDIUM_HARD: 0,
      //     HARD: 0,
      //     VERY_HARD: 0
      //   };

      //   // Get problem difficulty
      //   const difficulty = problem.difficulty;

      //   // Increment the count for this difficulty
      //   if (difficulty && user.solvedCounts.hasOwnProperty(difficulty)) {
      //     user.solvedCounts[difficulty] = (user.solvedCounts[difficulty] || 0) + 1;
      //   }

      //   // Increment totalSolved
      //   user.totalSolved = (user.totalSolved || 0) + 1;
      // }
      // }

      // --------------- 2 (new)
      if (status === "accepted") {
        // --- 1) Check if problem already solved (before making any changes) ---
        const probIdStr = problem._id.toString();
        const alreadySolved = (user.solvedProblems || []).some(id => id.toString() === probIdStr);
        
        console.log("Problem ID:", probIdStr);
        console.log("Already solved?", alreadySolved);
        console.log("Problem difficulty:", problem.difficulty);
        
        // --- 2) If first time solving, update solvedProblems and counts ---
        if (!alreadySolved) {
          // Add to solvedProblems
          user.solvedProblems = user.solvedProblems || [];
          user.solvedProblems.push(problem._id);

          // Initialize solvedCounts if not present
          user.solvedCounts = user.solvedCounts || {
            EASY: 0,
            MEDIUM: 0,
            MEDIUM_HARD: 0,
            HARD: 0,
            VERY_HARD: 0
          };

          // Get problem difficulty and increment the count
          const difficulty = problem.difficulty;
          console.log("Incrementing difficulty:", difficulty);
          
          if (difficulty && user.solvedCounts.hasOwnProperty(difficulty)) {
            user.solvedCounts[difficulty] = (user.solvedCounts[difficulty] || 0) + 1;
            console.log("New count for", difficulty, ":", user.solvedCounts[difficulty]);
          }

          // Increment totalSolved
          user.totalSolved = (user.totalSolved || 0) + 1;
          console.log("New totalSolved:", user.totalSolved);
        }

        // --- 3) Update preferredTags (always update on accepted submission) ---
        user.preferredTags = user.preferredTags || [];
        user.preferredTags = user.preferredTags.map(t =>
          typeof t === "string" ? { tag: t, count: 1 } : t
        );

        const problemTags = Array.isArray(problem.tags) ? problem.tags : [];
        for (const tag of problemTags) {
          const idx = user.preferredTags.findIndex(
            t => t.tag.toLowerCase() === tag.toLowerCase()
          );
          if (idx === -1) {
            user.preferredTags.push({ tag, count: 1 });
          } else {
            user.preferredTags[idx].count = (user.preferredTags[idx].count || 0) + 1;
          }
        }

        // --- 4) Recalculate preferred difficulty ---
        const difficultyMap = { EASY: 1, MEDIUM: 2, MEDIUM_HARD: 3, HARD: 4, VERY_HARD: 5 };
        const reverseMap = { 1: "EASY", 2: "MEDIUM", 3: "MEDIUM_HARD", 4: "HARD", 5: "VERY_HARD" };

        const solvedIds = (user.solvedProblems || []).map(
          id => new mongoose.Types.ObjectId(id)
        );
        if (solvedIds.length > 0) {
          const solvedDocs = await Problem.find(
            { _id: { $in: solvedIds } },
            "difficulty"
          ).lean();
          const totalScore = solvedDocs.reduce((sum, p) => {
            const d = p && p.difficulty ? difficultyMap[p.difficulty] || 1 : 1;
            return sum + d;
          }, 0);
          const avg = totalScore / solvedDocs.length;
          const rounded = Math.round(avg);
          user.preferredDifficulty = reverseMap[rounded] || user.preferredDifficulty || "EASY";
        }
      }

      // Log before saving
      console.log("User before save:", {
        solvedProblems: user.solvedProblems?.length,
        solvedCounts: user.solvedCounts,
        totalSolved: user.totalSolved,
        preferredTags: user.preferredTags
      });

      await user.save();
      console.log("User saved successfully.");
    }

    return res.status(201).json({ newSubmission });
  } catch (err) {
    console.error("createSubmission error:", err);
    return res.status(500).json({ message: err.message });
  }
};



/*
===> testcase failed:

-> Input
-> Output (testcase)
-> Expected

============================

===> testcase passed:

-> Input

-> Output (testcase)

-> Expected

===> all testcases

show all passed testcases on screen

*/

// ===========================================

exports.getSubmission = async (req, res) => {
  try {
    // match the correct field from your Submission schema
    const submissions = await Submission.find({ user: req.user._id }).populate("problem", "name difficulty tags")
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getSubmissionById = async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  console.log(submission);
  res.json(submission);
}

exports.updateSubmission = async (req, res) => {
  const { note } = req.body;

  const submission = await Submission.findById(req.params.id);
  submission.note = note;

  await submission.save();

  res.json({ message: "Updated", submission });
}

// =============================================================

// exports.createSubmission = async (req, res) => {
//   try {
//     const { language, version, code, problemId, startedAt, endedAt, elapsedTimeMs } = req.body;

//     // validate problem
//     const problem = await Problem.findById(problemId);
//     if (!problem) {
//       return res.status(404).json({ message: 'Problem not found' });
//     }

//     const testcases = problem.examples || [];

//     let allPassed = true;
//     let results = [];
//     let totalExecutionTime = 0;

//     for (const tc of testcases) {
//       try {
//         const apiRes = await axios.post('http://localhost:2000/api/v2/execute', {
//           language,
//           version,
//           files: [
//             {
//               name:
//                 language === "java"
//                   ? "Main.java"
//                   : language === "python"
//                     ? "main.py"
//                     : "main.js",
//               content: code,
//             },
//           ],
//           stdin: String(tc.input),
//         });

//         const run = apiRes.data.run || {};
//         const output = (run.stdout || "").trim();
//         const expected = (tc.output || "").trim();
//         const passed = output === expected;

//         if (!passed) allPassed = false;

//         results.push({
//           input: tc.input,
//           expected,
//           output,
//           passed,
//           executionTime: run.cpu_time ?? null,
//           error: run.stderr || null
//         });

//         if (run.cpu_time) totalExecutionTime += run.cpu_time;
//       } catch (error) {
//         allPassed = false;
//         results.push({
//           input: tc.input,
//           expected: tc.output || "",
//           output: "",
//           passed: false,
//           error: error.message
//         });
//       }
//     }

//     const status = allPassed ? "accepted" : "rejected";

//     // compute elapsedTimeMs if not provided but startedAt and endedAt are present
//     let computedElapsedMs = typeof elapsedTimeMs === 'number' ? elapsedTimeMs : undefined;
//     if ((computedElapsedMs === undefined) && startedAt && endedAt) {
//       const s = new Date(startedAt);
//       const e = new Date(endedAt);
//       if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e.getTime() >= s.getTime()) {
//         computedElapsedMs = e.getTime() - s.getTime();
//       }
//     }

//     const newSubmission = await Submission.create({
//       language,
//       version,
//       code,
//       note: req.body.note || "",
//       status,
//       results,
//       user: req.user._id,
//       problem: problemId,
//       startedAt: startedAt ? new Date(startedAt) : undefined,
//       endedAt: endedAt ? new Date(endedAt) : undefined,
//       elapsedTimeMs: computedElapsedMs,
//       executionTime: totalExecutionTime || undefined
//     });

//     // ====== Link submission to user and update preferences ======
//     const user = await User.findById(req.user._id);
//     if (user) {
//       user.submissions = user.submissions || [];
//       user.submissions.push(newSubmission._id);

//       if (status === "accepted") {
//         // --- 1) add solved problem (avoid duplicates) ---
//         const probIdStr = problem._id.toString();
//         const alreadySolved = (user.solvedProblems || []).some(id => id.toString() === probIdStr);
//         if (!alreadySolved) {
//           user.solvedProblems = user.solvedProblems || [];
//           user.solvedProblems.push(problem._id);
//         }

//         // --- 2) update preferredTags as counts (handles old plain-string shape too) ---
//         user.preferredTags = user.preferredTags || [];

//         // normalize existing shape: convert any plain-string entries to {tag, count:1}
//         user.preferredTags = user.preferredTags.map(t => {
//           if (typeof t === 'string') return { tag: t, count: 1 };
//           return t;
//         });

//         const problemTags = Array.isArray(problem.tags) ? problem.tags : [];
//         for (const tag of problemTags) {
//           const idx = user.preferredTags.findIndex(t => t.tag.toLowerCase() === tag.toLowerCase());
//           if (idx === -1) {
//             user.preferredTags.push({ tag, count: 1 });
//           } else {
//             user.preferredTags[idx].count = (user.preferredTags[idx].count || 0) + 1;
//           }
//         }

//         // --- 3) Recalculate preferredDifficulty from all solved problems (dynamic average) ---
//         const difficultyMap = { EASY: 1, MEDIUM: 2, MEDIUM_HARD: 3, HARD: 4, VERY_HARD: 5 };
//         const reverseMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'MEDIUM_HARD', 4: 'HARD', 5: 'VERY_HARD' };

//         // fetch difficulties for all solved problems (use user.solvedProblems which now includes the new problem)
//         const solvedIds = (user.solvedProblems || []).map(id => new mongoose.Types.ObjectId(id));
//         if (solvedIds.length > 0) {
//           const solvedDocs = await Problem.find({ _id: { $in: solvedIds } }, 'difficulty').lean();
//           const totalScore = solvedDocs.reduce((sum, p) => {
//             const d = p && p.difficulty ? (difficultyMap[p.difficulty] || 1) : 1;
//             return sum + d;
//           }, 0);
//           const avg = totalScore / solvedDocs.length;
//           const rounded = Math.round(avg);
//           user.preferredDifficulty = reverseMap[rounded] || user.preferredDifficulty || 'EASY';
//         }
//       }

//       await user.save();
//     }

//     return res.status(201).json({ newSubmission });
//   } catch (err) {
//     console.error('createSubmission error:', err);
//     return res.status(500).json({ message: err.message });
//   }
// };



// =============================================================

// My local
// const EXECUTE_URL = "http://localhost:2000/api/v2/execute";
// 
