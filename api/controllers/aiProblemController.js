const SingleProblem = require("../models/SingleProblem");
const AiProblem = require("../models/aiProblem");
const { HfInference } = require("@huggingface/inference");

// Initialize HuggingFace Inference Client
const hf = new HfInference(process.env.HF_TOKEN);

// =========================================================
// 🔥 Helper: Call LLM to Generate Problem Variant
// =========================================================
async function callLLMToGenerateVariant(original) {
    const prompt = `Generate a competitive programming problem variant in valid JSON format.

ORIGINAL:
Name: ${original.name}
Difficulty: ${original.difficulty}
Description: ${original.description.substring(0, 500)}...
Tags: ${original.tags ? original.tags.join(", ") : "N/A"}

REQUIREMENTS:
- Same difficulty: ${original.difficulty}
- Different theme/story
- Same algorithmic approach
- NEW examples and test cases

OUTPUT (JSON only, no markdown):
{
  "problem": {
    "name": "string",
    "difficulty": "${original.difficulty}",
    "description": "string (be concise)",
    "input": "string",
    "output": "string",
    "note": "string",
    "tags": ["tag1", "tag2"],
    "examples": [{"input": "...", "output": "...", "explanation": "..."}],
    "expected_time_complexity": "O(...)",
    "expected_auxiliary_space": "O(...)",
    "time_limit": "1 second",
    "memory_limit": "256 MB"
  }
}`;

/*

- 4 solutions (Python, JavaScript, Java, C++)

,
  "solutions": [
    {"language": "python", "code": "# solution"},
    {"language": "javascript", "code": "// solution"},
    {"language": "java", "code": "// solution"},
    {"language": "cpp", "code": "// solution"}
  ]

*/

    function safeParseJson(raw) {
        let cleaned = raw.trim();
        // Remove markdown blocks
        cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
        cleaned = cleaned.trim();
        
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            throw new Error(`JSON parse failed: ${e.message}`);
        }
    }

    // Models to try (smaller first for speed)
    const models = [
        "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct",
    ];

    const errors = [];

    for (const model of models) {
        try {
            console.log(`🤖 Trying model: ${model}...`);
            const startTime = Date.now();
            
            // Use HuggingFace Inference API
            const response = await hf.chatCompletion({
                model,
                messages: [
                    {
                        role: "system",
                        content: "Output ONLY valid JSON. No markdown, no explanations, just JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 4096,
                temperature: 0.7,
            });

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`⏱️  Model responded in ${elapsed}s`);

            const raw = response.choices?.[0]?.message?.content;
            if (!raw) {
                throw new Error("Empty response from model");
            }

            console.log("📄 Parsing response...");
            const parsed = safeParseJson(raw);

            // Quick validation
            // if (!parsed.problem?.name || !parsed.solutions?.length) {
            //     throw new Error("Invalid response structure");
            // }

            // if (!Array.isArray(parsed.problem.examples) || parsed.problem.examples.length === 0) {
            //     throw new Error("No examples provided");
            // }

            // const requiredLangs = ["python", "javascript", "java", "cpp"];
            // const providedLangs = parsed.solutions.map(s => s.language?.toLowerCase());
            
            // for (const lang of requiredLangs) {
            //     if (!providedLangs.includes(lang)) {
            //         throw new Error(`Missing ${lang} solution`);
            //     }
            // }

            // // Check for empty solutions
            // for (const sol of parsed.solutions) {
            //     if (!sol.code?.trim()) {
            //         throw new Error(`Empty code for ${sol.language}`);
            //     }
            // }

            console.log("✅ Valid variant generated");
            return parsed;

        } catch (err) {
            const errorMsg = `Model ${model} failed: ${err.message}`;
            console.error(`❌ ${errorMsg}`);
            errors.push(errorMsg);
            
            // Continue to next model unless it's a timeout
            if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
                break;
            }
        }
    }

    throw new Error(`All models failed:\n${errors.join('\n')}`);
}

// =========================================================
// 1️⃣ GENERATE AI PROBLEM
// =========================================================
exports.generateAiProblem = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        const { problemId } = req.params;

        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }

        // Fetch original problem
        const original = await SingleProblem.findById(problemId);
        if (!original) {
            return res.status(404).json({ message: "Original problem not found" });
        }

        console.log(`🚀 Generating AI variant for: ${original.name}`);
        console.log(`⏳ This may take 30-90 seconds...`);

        // Set a longer timeout for this response
        req.setTimeout(180000); // 3 minutes

        // Generate variant
        const aiData = await callLLMToGenerateVariant(original);

        // Save to database
        const saved = await AiProblem.create({
            originalProblemId: problemId,
            createdBy: userId,
            acceptedByUser: false,
            isPublic: false,
            difficulty: aiData.problem.difficulty || original.difficulty,
            name: aiData.problem.name,
            description: aiData.problem.description,
            input: aiData.problem.input,
            output: aiData.problem.output,
            note: aiData.problem.note || "",
            tags: aiData.problem.tags || original.tags || [],
            examples: aiData.problem.examples,
            expected_time_complexity: aiData.problem.expected_time_complexity || original.expected_time_complexity,
            expected_auxiliary_space: aiData.problem.expected_auxiliary_space || original.expected_auxiliary_space,
            time_limit: aiData.problem.time_limit || "1 second",
            memory_limit: aiData.problem.memory_limit || "256 MB",
            // solutions: aiData.solutions
        });

        console.log(`✅ Saved AI problem: ${saved._id}`);

        res.status(201).json({
            message: "AI variant generated successfully",
            problem: saved
        });

    } catch (err) {
        console.error("❌ Generation failed:", err);
        
        if (err.message.includes("not found")) {
            return res.status(404).json({ message: err.message });
        }
        
        if (err.message.includes("timeout") || err.message.includes("ETIMEDOUT")) {
            return res.status(504).json({ 
                message: "Request timed out. The AI service is taking too long. Please try again.",
                error: "Gateway timeout"
            });
        }

        if (err.message.includes("All models failed")) {
            return res.status(503).json({ 
                message: "AI service unavailable. All models failed to respond.",
                error: err.message 
            });
        }

        res.status(500).json({ 
            message: "Failed to generate AI problem", 
            error: err.message 
        });
    }
};

// =========================================================
// 2️⃣ ACCEPT AI PROBLEM
// =========================================================
exports.acceptAiProblem = async (req, res) => {
    try {
        const { problemId } = req.params;

        console.log(`👍 Accepting AI problem: ${problemId}`);

        // const updated = await AiProblem.findByIdAndUpdate(
        //     problemId,
        //     { acceptedByUser: true, isPublic: false },
        //     { new: true }
        // );

        // want to update it other way
        const problem = await AiProblem.findById(problemId);
        problem.acceptedByUser = true;

        // if (!updated) {
        //     return res.status(404).json({ message: "AI Problem not found" });
        // }

        res.json({ message: "AI Problem accepted", problem: problem });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// =========================================================
// 3️⃣ DELETE AI PROBLEM / REJECT AI PROBLEM
// =========================================================
exports.deleteAiProblem = async (req, res) => {
    try {
        const { problemId } = req.params;

        const problem = await AiProblem.findById(problemId);

        if (!problem) {
            return res.status(404).json({ message: "AI Problem not found" });
        }

        // Fix: Use req.user._id
        if (!req.user || !req.user._id) {
            return res.status(403).json({ message: "No user in request" });
        }

        if (problem.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await problem.deleteOne();

        res.json({ message: "AI Problem deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};


// =========================================================
// 4️⃣ GET ALL AI PROBLEMS
// =========================================================
exports.getAllAiProblems = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;

        const problems = await AiProblem.find({
            $or: [
                { isPublic: false },
                { createdBy: userId }
            ]
        }); // .populate("originalProblemId")

        res.json({
            message: "AI problems fetched successfully",
            problems
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// =========================================================
// 5️⃣ GET SINGLE AI PROBLEM
// =========================================================
exports.getAiProblemById = async (req, res) => {
    try {
        const { problemId } = req.params;

        console.log(`🔍 Fetching AI problem: ${problemId}`);

        const problem = await AiProblem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "AI problem not found" });
        }

        res.status(200).json({
            message: "AI problem fetched successfully",
            problem
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch AI problem", error: err.message });
    }
}

/*
(1)
ON Problem Compare Page
if (accept) = continue && save
if (not accept) = discard && delete from db

(2)
Get all ai problems created by user on user profile

(3)
Get single ai problem by id
*/