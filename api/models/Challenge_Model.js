const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
    input: {
        type: mongoose.Schema.Types.Mixed,
    },
    expectedOutput: {
        type: String,
    },
});

const challengeSchema = new mongoose.Schema(
    {
        UserID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            required: true,
        },
        Question: {
            type: String,
        },
        description: {
            type: String,
            required: true,
        },
        functionSignature: {
            type: String,
        },
        defaultBoilercode: {
            language: { type: String },
            inputType: { type: String },
            outputType: { type: String },
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Easy",
        },
        language: {
            type: [String],
            default: ["javascript"],
        },
        startTime: {
            type: Date,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number,
        },
        ChallengeFor: { type: String },
        isPublic: {
            type: Boolean,
            default: false,
        },
        testCases: [testCaseSchema],
        tags: {
            type: [String],
            default: [],
        },
        attempt: {
            type: Boolean,
            default: false,
        },
        thumbnailLink: {
            type: String,
        },
        examples: [
            {
                ExampleURl: { type: String },
                input: { type: String },
                output: { type: String },
            },
        ],
        SubmittedBy: [{ type: String }],
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports =
    mongoose.models.Challenge || mongoose.model("Challenge", challengeSchema);
