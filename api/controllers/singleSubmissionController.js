// controllers/singleSubmissionController.js
const User = require('../models/user.model');
const Problem = require('../models/SingleProblem');
const Submission = require('../models/SingleSubmission');
const axios = require('axios');

exports.createSubmission = async (req, res) => {
  try {
    const { language, version, code, problemId, startedAt, endedAt, elapsedTimeMs } = req.body;

    // validate problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const testcases = problem.examples || [];

    let allPassed = true;
    let results = [];
    let totalExecutionTime = 0; // aggregate CPU/run time (sum of testcases)

    for (const tc of testcases) {
      try {
        const apiRes = await axios.post('http://localhost:2000/api/v2/execute', {
          language,
          version,
          files: [
            {
              name:
                language === "java"
                  ? "Main.java"
                  : language === "python"
                    ? "main.py"
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
          error: run.stderr || null
        });

        if (run.cpu_time) {
          // keep raw value from Piston (units depend on Piston; don't auto-convert)
          totalExecutionTime += run.cpu_time;
        }
      } catch (error) {
        allPassed = false;
        results.push({
          input: tc.input,
          expected: tc.output || "",
          output: "",
          passed: false,
          error: error.message
        });
      }
    }

    const status = allPassed ? "accepted" : "rejected";

    // compute elapsedTimeMs if not provided but startedAt and endedAt are present
    let computedElapsedMs = typeof elapsedTimeMs === 'number' ? elapsedTimeMs : undefined;
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
      // stopwatch fields
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : undefined,
      elapsedTimeMs: computedElapsedMs,
      executionTime: totalExecutionTime || undefined
    });

    // Link submission to user (keep existing user model behavior)
    const user = await User.findById(req.user._id);
    if (user) {
      user.submissions = user.submissions || [];
      user.submissions.push(newSubmission._id);

      if (status === "accepted") {
        // Add problem to solvedProblems
        if (!user.solvedProblems.includes(problemId.toString())) {
          user.solvedProblems.push(problemId.toString());
        }

        // Auto-enrich preferredTags (optional)
        if (problem.tags && problem.tags.length > 0) {
          problem.tags.forEach(tag => {
            if (!user.preferredTags.includes(tag)) {
              user.preferredTags.push(tag);
            }
          });
        }
      }

      await user.save();
    }


    return res.status(201).json({ newSubmission });
  } catch (err) {
    console.error('createSubmission error:', err);
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
  const submissions = await Submission.find();
  res.json(submissions);
}

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