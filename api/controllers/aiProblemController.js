// const SingleProblem = require("../models/SingleProblem");
// const AiProblem = require("../models/aiProblem");
// const { HfInference } = require("@huggingface/inference");
// import { GoogleGenerativeAI } from "@google/generative-ai";
// require("dotenv").config();

// // Initialize HuggingFace Inference Client
// const hf = new HfInference(process.env.HF_TOKEN);

// // =========================================================
// // 🔥 Helper: Call LLM to Generate Problem Variant
// // =========================================================
// async function callLLMToGenerateVariant(original) {
//     const prompt = `Generate a competitive programming problem variant in valid JSON format.

// ORIGINAL:
// Name: ${original.name}
// Difficulty: ${original.difficulty}
// Description: ${original.description.substring(0, 500)}...
// Tags: ${original.tags ? original.tags.join(", ") : "N/A"}

// REQUIREMENTS:
// - Same difficulty: ${original.difficulty}
// - Different theme/story
// - Same algorithmic approach
// - NEW examples and test cases

// OUTPUT (JSON only, no markdown):
// {
//   "problem": {
//     "name": "string",
//     "difficulty": "${original.difficulty}",
//     "description": "string (be concise)",
//     "input": "string",
//     "output": "string",
//     "note": "string",
//     "tags": ["tag1", "tag2"],
//     "examples": [{"input": "...", "output": "...", "explanation": "..."}],
//     "expected_time_complexity": "O(...)",
//     "expected_auxiliary_space": "O(...)",
//     "time_limit": "1 second",
//     "memory_limit": "256 MB"
//   }
// }`;

// /*

// - 4 solutions (Python, JavaScript, Java, C++)

// ,
//   "solutions": [
//     {"language": "python", "code": "# solution"},
//     {"language": "javascript", "code": "// solution"},
//     {"language": "java", "code": "// solution"},
//     {"language": "cpp", "code": "// solution"}
//   ]

// */

//     function safeParseJson(raw) {
//         let cleaned = raw.trim();
//         // Remove markdown blocks
//         cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
//         cleaned = cleaned.trim();
        
//         try {
//             return JSON.parse(cleaned);
//         } catch (e) {
//             throw new Error(`JSON parse failed: ${e.message}`);
//         }
//     }

//     // Models to try (smaller first for speed)
//     const models = [
//         "google/gemini-2.0-flash-exp",
//         "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
//         "Qwen/Qwen2.5-7B-Instruct",
//         "Qwen/Qwen2.5-72B-Instruct",
//     ];

//     const errors = [];

//     for (const model of models) {
//         try {
//             console.log(`🤖 Trying model: ${model}...`);
//             const startTime = Date.now();
            
//             // Use HuggingFace Inference API
//             const response = await hf.chatCompletion({
//                 model,
//                 messages: [
//                     {
//                         role: "system",
//                         content: "Output ONLY valid JSON. No markdown, no explanations, just JSON."
//                     },
//                     {
//                         role: "user",
//                         content: prompt
//                     }
//                 ],
//                 max_tokens: 4096,
//                 temperature: 0.7,
//             });

//             const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
//             console.log(`⏱️  Model responded in ${elapsed}s`);

//             const raw = response.choices?.[0]?.message?.content;
//             if (!raw) {
//                 throw new Error("Empty response from model");
//             }

//             console.log("📄 Parsing response...");
//             const parsed = safeParseJson(raw);


//             console.log("✅ Valid variant generated");
//             return parsed;

//         } catch (err) {
//             const errorMsg = `Model ${model} failed: ${err.message}`;
//             console.error(`❌ ${errorMsg}`);
//             errors.push(errorMsg);
            
//             // Continue to next model unless it's a timeout
//             if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
//                 break;
//             }
//         }
//     }

//     throw new Error(`All models failed:\n${errors.join('\n')}`);
// }

// // =========================================================
// // 1️⃣ GENERATE AI PROBLEM
// // =========================================================
// exports.generateAiProblem = async (req, res) => {
//     try {
//         const userId = req.user.id || req.user._id || req.user.userId;
//         const { problemId } = req.params;

//         if (!problemId) {
//             return res.status(400).json({ message: "Problem ID is required" });
//         }

//         // Fetch original problem
//         const original = await SingleProblem.findById(problemId);
//         if (!original) {
//             return res.status(404).json({ message: "Original problem not found" });
//         }

//         console.log(`🚀 Generating AI variant for: ${original.name}`);
//         console.log(`⏳ This may take 30-90 seconds...`);

//         // Set a longer timeout for this response
//         req.setTimeout(180000); // 3 minutes

//         // Generate variant
//         const aiData = await callLLMToGenerateVariant(original);

//         // Save to database
//         const saved = await AiProblem.create({
//             originalProblemId: problemId,
//             createdBy: userId,
//             acceptedByUser: false,
//             isPublic: false,

//             problemType: "aiProblem",

//             difficulty: aiData.problem.difficulty || original.difficulty,
//             name: aiData.problem.name,
//             description: aiData.problem.description,
//             input: aiData.problem.input,
//             output: aiData.problem.output,
//             note: aiData.problem.note || "",
//             tags: aiData.problem.tags || original.tags || [],
//             examples: aiData.problem.examples,
//             expected_time_complexity: aiData.problem.expected_time_complexity || original.expected_time_complexity,
//             expected_auxiliary_space: aiData.problem.expected_auxiliary_space || original.expected_auxiliary_space,
//             time_limit: aiData.problem.time_limit || "1 second",
//             memory_limit: aiData.problem.memory_limit || "256 MB",
//             // solutions: aiData.solutions
//         });

//         console.log(`✅ Saved AI problem: ${saved._id}`);

//         res.status(201).json({
//             message: "AI variant generated successfully",
//             problem: saved
//         });

//     } catch (err) {
//         console.error("❌ Generation failed:", err);
        
//         if (err.message.includes("not found")) {
//             return res.status(404).json({ message: err.message });
//         }
        
//         if (err.message.includes("timeout") || err.message.includes("ETIMEDOUT")) {
//             return res.status(504).json({ 
//                 message: "Request timed out. The AI service is taking too long. Please try again.",
//                 error: "Gateway timeout"
//             });
//         }

//         if (err.message.includes("All models failed")) {
//             return res.status(503).json({ 
//                 message: "AI service unavailable. All models failed to respond.",
//                 error: err.message 
//             });
//         }

//         res.status(500).json({ 
//             message: "Failed to generate AI problem", 
//             error: err.message 
//         });
//     }
// };

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const SingleProblem = require("../models/SingleProblem");
const AiProblem = require("../models/aiProblem");
require("dotenv").config();

const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HF_TOKEN);

// ======================================================================
// 🧠 JSON CLEANER — Never breaks even if model outputs trash
// ======================================================================
function cleanJson(raw) {
    if (!raw) return null;

    let text = raw.trim();

    // Extract <json>...</json>
    const tagMatch = text.match(/<json>([\s\S]*?)<\/json>/i);
    if (tagMatch) text = tagMatch[1];

    // Remove fences
    text = text.replace(/```json|```/gi, "").trim();

    // Normalize quotes
    text = text
        .replace(/“|”/g, '"')
        .replace(/‘|’/g, "'");

    // Fix trailing commas
    text = text.replace(/,\s*}/g, "}");
    text = text.replace(/,\s*]/g, "]");

    // Remove stray backslashes
    text = text.replace(/\\(?=\s*")/g, "");

    try {
        return JSON.parse(text);
    } catch (err) {
        console.log("❌ JSON parse failed after cleaning:", err.message);
        return null;
    }
}

// ======================================================================
// 🌟 HUGGINGFACE MODEL RUNNER
// ======================================================================
async function tryHF(prompt, modelName) {
    try {
        console.log(`🤖 Trying HF model: ${modelName}`);

        const response = await hf.chatCompletion({
            model: modelName,
            messages: [
                { role: "system", content: "Return ONLY valid JSON inside <json></json>" },
                { role: "user", content: prompt }
            ]
        });

        const raw = response.choices?.[0]?.message?.content;
        if (!raw) return null;

        return cleanJson(raw);
    } catch (err) {
        console.log(`❌ HF ${modelName} failed:`, err.message);
        return null;
    }
}

// ======================================================================
// 🌟 MAIN LLM GENERATOR 
// ======================================================================
async function callLLMToGenerateVariant(original) {
    const prompt = `
Generate a **NEW competitive programming problem variant**.

Return ONLY:

<json>
{
  "problem": {
    "name": "",
    "difficulty": "${original.difficulty}",
    "description": "",
    "input": "",
    "output": "",
    "note": "",
    "tags": [],
    "examples": [
      {"input": "", "output": "", "explanation": ""}
    ],
    "expected_time_complexity": "",
    "expected_auxiliary_space": "",
    "time_limit": "1 second",
    "memory_limit": "256 MB"
  }
}
</json>

✓ Different story/theme  
✓ Same difficulty (${original.difficulty})  
✓ Same algorithmic concept  
✓ ALL EXAMPLES MUST BE SELF-VERIFIED EXACTLY  

---

ORIGINAL:
Name: ${original.name}
Description: ${original.description.substring(0, 300)}...
Tags: ${original.tags?.join(", ") || "None"}
`;

    // HuggingFace model fallback chain
    const models = [
        "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct"
    ];

    for (const m of models) {
        const res = await tryHF(prompt, m);
        if (res?.problem) return res;
    }

    throw new Error("All models failed to generate valid JSON.");
}

// ======================================================================
// 🚀 API ROUTE: Generate AI Variant
// ======================================================================
exports.generateAiProblem = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { problemId } = req.params;

        if (!problemId)
            return res.status(400).json({ message: "Problem ID is required" });

        const original = await SingleProblem.findById(problemId);
        if (!original)
            return res.status(404).json({ message: "Original problem not found" });

        console.log(`🚀 Generating AI variant for: ${original.name}`);
        req.setTimeout(180000);

        // CALL LLM (HuggingFace only)
        const aiData = await callLLMToGenerateVariant(original);
        const p = aiData.problem;

        // Save to DB
        const saved = await AiProblem.create({
            originalProblemId: problemId,
            createdBy: userId,
            acceptedByUser: false,
            isPublic: false,

            problemType: "aiProblem",

            difficulty: p.difficulty,
            name: p.name,
            description: p.description,
            input: p.input,
            output: p.output,
            note: p.note || "",
            tags: p.tags || [],
            examples: p.examples,
            expected_time_complexity: p.expected_time_complexity,
            expected_auxiliary_space: p.expected_auxiliary_space,
            time_limit: p.time_limit,
            memory_limit: p.memory_limit,
        });

        res.status(201).json({
            message: "AI problem generated successfully",
            problem: saved
        });

    } catch (err) {
        console.error("❌ Generation failed:", err);
        res.status(500).json({
            message: "Generation failed",
            error: err.message
        });
    }
};




// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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