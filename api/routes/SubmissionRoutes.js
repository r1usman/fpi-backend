
const express = require("express");
const axios = require("axios");
const { Protect } = require("../utils/Token.js");
const router = express.Router();
const Submission_Model = require("../models/Submission.js");
const Challenge_Model = require("../models/Challenge_Model.js");
const Submission = require("../models/Submission.js");

const JUDGE0_API = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
console.log(RAPIDAPI_KEY);



// Language mapping
const languageMap = {
    python: 71,
    cpp: 54,
    java: 62,
    javascript: 63,
    Java: 62,

};

router.post("/Create", Protect, async (req, res) => {
    try {
        const { ChallengeID } = req.body;
        console.log('Here');

        const DefaultSubmission = {
            code: "",
            result: "Pending",
            language: "",
            totalTestCase: 0,
            totalTestCaseClear: 0,
            testCases: [
                {
                    input: null,
                    expectedOutput: null,
                }
            ],
            DetailTestCases: [
                {
                    input: "",
                    expected: "",
                    output: "",
                    status: "",
                    time: 0,
                    memory: 0
                }
            ]
        }
        const CreateSubmission = await Submission_Model.create({
            challengeID: ChallengeID,
            studentID: req.user._id,
            ...DefaultSubmission
        })
        res.send(CreateSubmission);

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
})
router.delete("/Delete/:id", Protect, async (req, res) => {
    try {
        const response = await Submission_Model.findByIdAndDelete({ _id: req.params.id })
        if (!response) {
            return res.status(500).json({ message: "Failed to delete item due to server error" });
        }
        return res.send("Submission Deleted");

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }

})

router.get("/GetAllByInstructor", Protect, async (req, res) => {
    try {
        const Status = req.user.status;
        if (Status == "Student")
            return res.status(401).json({ message: "Students are not Allowed to Create a Challenge" })

        const submissions = await Submission_Model.find({ _id: id });

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: "No submissions found" });
        }

        res.status(200).json(submissions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get("/StudentSubmission", Protect, async (req, res) => {
    try {
        const response = await Submission_Model.find({
            studentID: req.user._id,
            result: { $ne: "Pending" }
        }).populate("challengeID");
        console.log(response);

        if (!response || response.length == 0)
            return res.status(404).json({ message: "No submissions found" });

        res.send(response)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

const HandleTestcases = async (code, language, testCases) => {
    try {
        // console.log("code", code);
        // console.log("language", language);
        // console.log("testCases", testCases);

        if (!languageMap[language]) {
            throw new Error("Language not supported");
        }

        const results = [];

        for (const tc of testCases) {
            // Normalize input into a single string for Judge0
            let stdinValue;
            if (Array.isArray(tc.input)) {
                stdinValue = tc.input.map(v => String(v).trim()).join("\n");
            } else {
                stdinValue = String(tc.input).trim();
            }

            // Normalize expected output
            const expectedOutput = String(tc.expectedOutput).trim();

            const submission = await axios.post(
                `${JUDGE0_API}/submissions?wait=true`,
                {
                    language_id: languageMap[language],
                    source_code: code,
                    stdin: stdinValue,
                    expected_output: expectedOutput
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-RapidAPI-Key": RAPIDAPI_KEY,
                        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
                    }
                }
            );

            results.push({
                input: tc.input,
                expected: expectedOutput,
                output: submission.data.stdout?.trim() ?? "",
                status: submission.data.status?.description,
                time: submission.data.time,
                memory: submission.data.memory
            });
        }

        return results;

    } catch (error) {
        console.error(error);
        return [];
    }
};




router.put("/Update/:id", Protect, async (req, res) => {
    try {
        let submission = await Submission_Model.findById(req.params.id);

        const ChallengeId = submission.challengeID;
        if (!submission) {
            return res.status(404).json({ message: "No submissions found" });
        }
        Object.assign(submission, req.body);
        const { code, language, testCases } = submission;

        if (submission.result == "Eliminated") {

            await submission.save();
            const ChallengeUpdate = await Challenge_Model.findOne({ _id: submission.challengeID })
            ChallengeUpdate.SubmittedBy = [...ChallengeUpdate.SubmittedBy, submission.studentID];
            ChallengeUpdate.save();
        }
        else {
            const getSubmissionResult = await HandleTestcases(code, language, testCases);
            console.log("getSubmissionResult", getSubmissionResult);

            if (getSubmissionResult) {
                submission.DetailTestCases = getSubmissionResult;
            }

            const TestCasePassed = getSubmissionResult.filter((item) => item.status == "Accepted").length;
            const TotalCase = getSubmissionResult.length;
            const result = TestCasePassed >= 1 ? "Passed" : "Failed"


            submission.result = result || submission.result
            submission.totalTestCaseClear = TestCasePassed
            submission.totalTestCase = TotalCase || submission.totalTestCase

            await submission.save();

            const ChallengeUpdate = await Challenge_Model.findOne({ _id: submission.challengeID })
            ChallengeUpdate.SubmittedBy = [...ChallengeUpdate.SubmittedBy, submission.studentID];
            ChallengeUpdate.save();
        }
        res.json(submission);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get("/ranking/:challengeId", async (req, res) => {
    try {
        const challengeId = req.params.challengeId;


        let submissions = await Submission.find({
            challengeID: challengeId,
            result: "Passed"
        }).lean().populate("studentID");


        submissions.sort((a, b) => {

            if (b.totalTestCaseClear !== a.totalTestCaseClear) {
                return b.totalTestCaseClear - a.totalTestCaseClear;
            }

            let aTime = Math.min(...a.DetailTestCases.map(tc => tc.time));
            let bTime = Math.min(...b.DetailTestCases.map(tc => tc.time));
            if (aTime !== bTime) {
                return aTime - bTime;
            }

            let aMemory = Math.min(...a.DetailTestCases.map(tc => tc.memory));
            let bMemory = Math.min(...b.DetailTestCases.map(tc => tc.memory));
            if (aMemory !== bMemory) {
                return aMemory - bMemory;
            }

            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        const ranked = submissions.map((s, i) => ({
            rank: i + 1,
            studentID: s.studentID,
            totalTestCaseClear: s.totalTestCaseClear,
            totalTestCase: s.totalTestCase,
            executionTime: Math.min(...s.DetailTestCases.map(tc => tc.time)),
            memory: Math.min(...s.DetailTestCases.map(tc => tc.memory)),
            createdAt: s.createdAt
        }));

        res.json(ranked);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


router.get('/top3-submissions', async (req, res) => {
    try {
        const topStudents = await Submission_Model.aggregate([
            {
                $match: {
                    result: { $ne: "Pending" }
                }
            },
            {
                $group: {
                    _id: "$studentID",
                    submissionCount: { $sum: 1 }
                }
            },
            {
                $sort: {
                    submissionCount: -1
                }
            },
            {
                $limit: 3
            }
        ])
        const populated = await Submission_Model.populate(topStudents, {
            path: "_id",
            model: "User",
            select: "name email"
        });


        res.json(topStudents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// router.post("/Submit", async (req, res) => {
//     try {
//         const { language, code, testCases } = req.body;

//         if (!languageMap[language]) {
//             return res.status(400).json({ error: "Language not supported" });
//         }

//         const results = [];

//         for (const tc of testCases) {
//             const submission = await axios.post(
//                 `${JUDGE0_API}/submissions?wait=true`,
//                 {
//                     language_id: languageMap[language],
//                     source_code: code,
//                     stdin: tc.input,
//                     expected_output: tc.expectedOutput
//                 },
//                 {
//                     headers: {
//                         "Content-Type": "application/json",
//                         "X-RapidAPI-Key": RAPIDAPI_KEY,
//                         "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
//                     }
//                 }
//             );

//             results.push({
//                 input: tc.input,
//                 expected: tc.expectedOutput,
//                 output: submission.data.stdout,
//                 status: submission.data.status.description,
//                 time: submission.data.time,
//                 memory: submission.data.memory
//             });
//         }

//         res.json({ results });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Error processing submission" });
//     }
// });

module.exports = router;
