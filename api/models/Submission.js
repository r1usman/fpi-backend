const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        challengeID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true
        },
        studentID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        code: {
            type: String,
        },
        language: {
            type: String
        },
        result: {
            type: String,
            enum: ["Passed", "Failed", "Eliminated", "Pending"],
            default: 'Pending'
        },
        totalTestCaseClear: { type: Number },
        totalTestCase: { type: Number },
        testCases: [
            {
                input: { type: mongoose.Schema.Types.Mixed },
                expectedOutput: { type: mongoose.Schema.Types.Mixed }
            }
        ],
        DetailTestCases: [
            {
                input: { type: mongoose.Schema.Types.Mixed },
                expected: { type: mongoose.Schema.Types.Mixed },
                output: { type: String },
                status: { type: String },
                time: { type: Number },
                memory: { type: Number },
            }
        ],
    },
    { timestamps: true }
);

module.exports =
    mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
