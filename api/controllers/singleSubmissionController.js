const User = require('../models/user.model');
const Problem = require('../models/SingleProblem');
const Submission = require('../models/SingleSubmission')
const axios = require('axios');

exports.createSubmission = async (req, res) => {
  const { language, version, code, problemId } = req.body;

  // (1) Get the problem and its examples
  const problem = await Problem.findById(problemId);
  const testcases = problem.examples;

  let allPassed = true;
  let results = [];

  for (const tc of testcases) {

    console.log("Testcase input: ", tc.input)
    console.log("Testcase output: ", tc.output)

    try {
      // Send code to Piston API for each test case
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

      const run = apiRes.data.run;
      const output = (run.stdout || "").trim();
      const expected = (tc.output || "").trim();

      console.log("======================================");
      console.log("output from piston: ", output);
      console.log("expected: ", expected);


      const passed = output === expected;

      if (!passed) allPassed = false;

      results.push({
        input: tc.input,
        expected,
        output,
        passed,
        executionTime: run.cpu_time,
      });

    } catch (error) {
      allPassed = false;
      results.push({
        input: tc.input,
        error: error.message,
        passed: false
      });
    }
  }

  // Determine final status
  const status = allPassed ? "accepted" : "rejected";

  console.log(allPassed);
  console.log(results);

  // Store submission
  const newSubmission = await Submission.create({
    language,
    version,
    code,
    note: "",
    status,
    results, // store detailed results
    user: req.user._id
  });

  // Link submission to user
  const user = await User.findById(req.user._id);
  user.submissions.push(newSubmission._id);
  await user.save();

  res.json({ newSubmission });
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