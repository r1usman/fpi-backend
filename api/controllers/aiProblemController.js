// const SingleProblem = require("../models/SingleProblem");
// const AiProblem = require("../models/aiProblem");
// require("dotenv").config();

// const { HfInference } = require("@huggingface/inference");
// const hf = new HfInference(process.env.HF_TOKEN);

// // ======================================================================
// // 🧠 JSON CLEANER — Never breaks even if model outputs trash
// // ======================================================================
// function cleanJson(raw) {
//     if (!raw) return null;

//     let text = raw.trim();

//     // Extract <json>...</json>
//     const tagMatch = text.match(/<json>([\s\S]*?)<\/json>/i);
//     if (tagMatch) text = tagMatch[1];

//     // Remove fences
//     text = text.replace(/```json|```/gi, "").trim();

//     // Normalize quotes
//     text = text
//         .replace(/“|”/g, '"')
//         .replace(/‘|’/g, "'");

//     // Fix trailing commas
//     text = text.replace(/,\s*}/g, "}");
//     text = text.replace(/,\s*]/g, "]");

//     // Remove stray backslashes
//     text = text.replace(/\\(?=\s*")/g, "");

//     try {
//         return JSON.parse(text);
//     } catch (err) {
//         console.log("❌ JSON parse failed after cleaning:", err.message);
//         return null;
//     }
// }

// // ======================================================================
// // 🌟 HUGGINGFACE MODEL RUNNER
// // ======================================================================
// async function tryHF(prompt, modelName) {
//     try {
//         console.log(`🤖 Trying HF model: ${modelName}`);

//         const response = await hf.chatCompletion({
//             model: modelName,
//             messages: [
//                 { role: "system", content: "Return ONLY valid JSON inside <json></json>" },
//                 { role: "user", content: prompt }
//             ]
//         });

//         const raw = response.choices?.[0]?.message?.content;
//         if (!raw) return null;

//         return cleanJson(raw);
//     } catch (err) {
//         console.log(`❌ HF ${modelName} failed:`, err.message);
//         return null;
//     }
// }

// // ======================================================================
// // 🌟 MAIN LLM GENERATOR 
// // ======================================================================
// async function callLLMToGenerateVariant(original) {
//     const prompt = `
// Generate a **NEW competitive programming problem variant**.

// Return ONLY:

// <json>
// {
//   "problem": {
//     "name": "",
//     "difficulty": "${original.difficulty}",
//     "description": "",
//     "input": "",
//     "output": "",
//     "note": "",
//     "tags": [],
//     "examples": [
//       {"input": "", "output": "", "explanation": ""}
//     ],
//     "expected_time_complexity": "",
//     "expected_auxiliary_space": "",
//     "time_limit": "1 second",
//     "memory_limit": "256 MB"
//   }
// }
// </json>

// ✓ Different story/theme  
// ✓ Same difficulty (${original.difficulty})  
// ✓ Same algorithmic concept  
// ✓ ALL EXAMPLES MUST BE SELF-VERIFIED EXACTLY  

// ---

// ORIGINAL:
// Name: ${original.name}
// Description: ${original.description.substring(0, 300)}...
// Tags: ${original.tags?.join(", ") || "None"}
// `;

//     // HuggingFace model fallback chain
//     const models = [
//         "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
//         "Qwen/Qwen2.5-7B-Instruct",
//         "Qwen/Qwen2.5-72B-Instruct"
//     ];

//     for (const m of models) {
//         const res = await tryHF(prompt, m);
//         if (res?.problem) return res;
//     }

//     throw new Error("All models failed to generate valid JSON.");
// }

// // ======================================================================
// // 🚀 API ROUTE: Generate AI Variant
// // ======================================================================
// exports.generateAiProblem = async (req, res) => {
//     try {
//         const userId = req.user.id || req.user._id;
//         const { problemId } = req.params;

//         if (!problemId)
//             return res.status(400).json({ message: "Problem ID is required" });

//         const original = await SingleProblem.findById(problemId);
//         if (!original)
//             return res.status(404).json({ message: "Original problem not found" });

//         console.log(`🚀 Generating AI variant for: ${original.name}`);
//         req.setTimeout(180000);

//         // CALL LLM (HuggingFace only)
//         const aiData = await callLLMToGenerateVariant(original);
//         const p = aiData.problem;

//         // Save to DB
//         const saved = await AiProblem.create({
//             originalProblemId: problemId,
//             createdBy: userId,
//             acceptedByUser: false,
//             isPublic: false,

//             problemType: "aiProblem",

//             difficulty: p.difficulty,
//             name: p.name,
//             description: p.description,
//             input: p.input,
//             output: p.output,
//             note: p.note || "",
//             tags: p.tags || [],
//             examples: p.examples,
//             expected_time_complexity: p.expected_time_complexity,
//             expected_auxiliary_space: p.expected_auxiliary_space,
//             time_limit: p.time_limit,
//             memory_limit: p.memory_limit,
//         });

//         res.status(201).json({
//             message: "AI problem generated successfully",
//             problem: saved
//         });

//     } catch (err) {
//         console.error("❌ Generation failed:", err);
//         res.status(500).json({
//             message: "Generation failed",
//             error: err.message
//         });
//     }
// };




// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// // =========================================================
// // 2️⃣ ACCEPT AI PROBLEM
// // =========================================================
// exports.acceptAiProblem = async (req, res) => {
//     try {
//         const { problemId } = req.params;

//         console.log(`👍 Accepting AI problem: ${problemId}`);

//         // const updated = await AiProblem.findByIdAndUpdate(
//         //     problemId,
//         //     { acceptedByUser: true, isPublic: false },
//         //     { new: true }
//         // );

//         // want to update it other way
//         const problem = await AiProblem.findById(problemId);
//         problem.acceptedByUser = true;

//         // if (!updated) {
//         //     return res.status(404).json({ message: "AI Problem not found" });
//         // }

//         res.json({ message: "AI Problem accepted", problem: problem });

//     } catch (err) {
//         res.status(500).json({ message: "Server Error", error: err.message });
//     }
// };

// // =========================================================
// // 3️⃣ DELETE AI PROBLEM / REJECT AI PROBLEM
// // =========================================================
// exports.deleteAiProblem = async (req, res) => {
//     try {
//         const { problemId } = req.params;

//         const problem = await AiProblem.findById(problemId);

//         if (!problem) {
//             return res.status(404).json({ message: "AI Problem not found" });
//         }

//         // Fix: Use req.user._id
//         if (!req.user || !req.user._id) {
//             return res.status(403).json({ message: "No user in request" });
//         }

//         if (problem.createdBy.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: "Not authorized" });
//         }

//         await problem.deleteOne();

//         res.json({ message: "AI Problem deleted successfully" });

//     } catch (err) {
//         res.status(500).json({ message: "Server Error", error: err.message });
//     }
// };


// // =========================================================
// // 4️⃣ GET ALL AI PROBLEMS
// // =========================================================
// exports.getAllAiProblems = async (req, res) => {
//     try {
//         const userId = req.user.id || req.user._id || req.user.userId;

//         const problems = await AiProblem.find({
//             $or: [
//                 { isPublic: false },
//                 { createdBy: userId }
//             ]
//         }); // .populate("originalProblemId")

//         res.json({
//             message: "AI problems fetched successfully",
//             problems
//         });

//     } catch (err) {
//         res.status(500).json({ message: "Server Error", error: err.message });
//     }
// };

// // =========================================================
// // 5️⃣ GET SINGLE AI PROBLEM
// // =========================================================
// exports.getAiProblemById = async (req, res) => {
//     try {
//         const { problemId } = req.params;

//         console.log(`🔍 Fetching AI problem: ${problemId}`);

//         const problem = await AiProblem.findById(problemId);
//         if (!problem) {
//             return res.status(404).json({ message: "AI problem not found" });
//         }

//         res.status(200).json({
//             message: "AI problem fetched successfully",
//             problem
//         });
//     } catch (err) {
//         res.status(500).json({ message: "Failed to fetch AI problem", error: err.message });
//     }
// }


// =========================================================
// =========================================================

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

// ========================================================
// ========================================================
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// =========================================================
// aiProblemController.js (FINAL FIXED VERSION)
// =========================================================

const SingleProblem = require("../models/SingleProblem");
const AiProblem = require("../models/aiProblem");
require("dotenv").config();

const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HF_TOKEN);

// ======================================================================
// 🧹 1. JSON CLEANING + VALIDATION (DET-MODE)
// ======================================================================
function cleanJson(raw) {
    if (!raw) return null;

    let text = raw.trim();

    // Extract <json>...</json>
    const tagMatch = text.match(/<json>([\s\S]*?)<\/json>/i);
    if (tagMatch) text = tagMatch[1];

    // Remove code fences
    text = text.replace(/```json|```/gi, "").trim();

    // Normalize quotes
    text = text.replace(/“|”/g, '"').replace(/‘|’/g, "'");

    // Remove trailing commas
    text = text.replace(/,\s*}/g, "}");
    text = text.replace(/,\s*]/g, "]");

    // Remove escape-before-quotes
    text = text.replace(/\\(?=")/g, "");

    try {
        return JSON.parse(text);
    } catch (err) {
        console.log("❌ JSON parse failed:", err.message);
        return null;
    }
}

// ======================================================================
// 🧪 2. SELF-VERIFIED PROBLEM VALIDATOR
// ======================================================================
function validateGeneratedProblem(p) {
    const required = [
        "name", "description", "input", "output",
        "examples", "expected_time_complexity",
        "expected_auxiliary_space"
    ];

    for (const f of required) {
        if (!p[f]) return `Missing field: ${f}`;
    }

    // Validate examples
    if (!Array.isArray(p.examples) || p.examples.length === 0) {
        return "Examples must be a non-empty array";
    }

    for (const ex of p.examples) {
        if (!ex.input || !ex.output) {
            return "Each example must have input & output";
        }
    }

    return null;
}

// ======================================================================
// 🤖 3. HuggingFace model wrapper
// ======================================================================
async function tryHF(prompt, modelName) {
    try {
        console.log("🤖 Trying model:", modelName);

        const response = await hf.chatCompletion({
            model: modelName,
            messages: [
                {
                    role: "system",
                    content:
                        "Return ONLY valid JSON inside <json></json>. Do NOT add explanation."
                },
                { role: "user", content: prompt }
            ]
        });

        const raw = response?.choices?.[0]?.message?.content;
        if (!raw) return null;

        return cleanJson(raw);
    } catch (err) {
        console.log(`❌ HF model ${modelName} failed:`, err.message);
        return null;
    }
}

// ======================================================================
// 🔥 4. MAIN LLM GENERATION FUNCTION
// ======================================================================
async function callLLMToGenerateVariant(original) {
    const prompt = `
You MUST follow a 2-stage generation process:

STAGE 1 — INTERNAL REASONING (do NOT output JSON)
- add prefix or postfix to original problem name to differentiate it
- Different story/theme, make sure this accurately defines a NEW problem.
- Think step-by-step.
- Construct the problem.
- Generate examples.
- Verify examples by hand.
- Re-check logic and constraints.
- Confirm that all samples match the rules.

DO NOT output the reasoning.

STAGE 2 — OUTPUT JSON (in <json></json>)
Return ONLY valid JSON.

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

RULES:
- ALL 2 examples must be manually checked in STAGE 1.
- NO contradictions.
- NO impossible outputs.
- No reuse of original examples.
- Must be mathematically sound.


Original Problem:
${original.name}
${original.description.substring(0, 300)}...
Tags: ${original.tags?.join(", ") || "None"}
`;

    // const models = [
    //     "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
    //     "Qwen/Qwen2.5-7B-Instruct",
    //     "Qwen/Qwen2.5-72B-Instruct"
    // ];

//     const models = [
//     "Qwen/Qwen3-235B-A22B-Instruct",
//     "Qwen/Qwen3-Next-80B-A3B-Instruct",
//     "deepseek-ai/DeepSeek-V3.2", 
//     "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
//     "meta-llama/Llama-3.3-70B-Instruct",
//     "Qwen/Qwen2.5-7B-Instruct"
// ];

    const models = [
  "meta-llama/Llama-3.3-70B-Instruct:nebius",
  "deepseek-ai/DeepSeek-R1:cerebras",
  "meta-llama/Meta-Llama-3-8B-Instruct:nebius",
  "meta-llama/Llama-3.1-8B-Instruct:nebius"
];



    for (const m of models) {
        const data = await tryHF(prompt, m);

        if (data?.problem) {
            const err = validateGeneratedProblem(data.problem);
            if (!err) return data; // valid output
            console.log("⚠️ Validation failed:", err);
        }
    }

    throw new Error("All models failed to produce valid JSON.");
}

// ======================================================================
// 🚀 5. Generate AI Problem Route
// ======================================================================
// function sanitizeExampleInput(input) {
//     if (!input) return input;

//     // Remove everything except digits and whitespace
//     input = input.replace(/,/g, " ");        // Convert commas → spaces
//     input = input.replace(/\s+/g, " ");      // Collapse multiple spaces
//     return input.trim();
// }

function sanitizeExampleInput(input) {
    if (!input) return input;

    // Remove labels like "Input:" or "Output:"
    input = input.replace(/^(input:)/i, "");
    input = input.replace(/^(output:)/i, "");

    // Remove angle brackets and square brackets
    input = input.replace(/[\[\]<>]/g, " ");

    // Remove commas → spaces
    input = input.replace(/,/g, " ");

    // Collapse extra spaces
    input = input.replace(/\s+/g, " ").trim();

    // Convert flat list "1 2 3 4" into judge format:
    // N\nnumbers
    const parts = input.split(" ").map(n => n.trim()).filter(n => n.length);

    if (parts.every(p => /^-?\d+$/.test(p))) {
        const n = parts.length;
        return `${n}\n${parts.join(" ")}`;
    }

    return input;
}



exports.generateAiProblem = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { problemId } = req.params;

        if (!problemId)
            return res.status(400).json({ message: "Problem ID required" });

        const original = await SingleProblem.findById(problemId);
        if (!original)
            return res.status(404).json({ message: "Original problem not found" });

        req.setTimeout(200000);

        console.log("🎯 Generating variant for:", original.name);

        const aiData = await callLLMToGenerateVariant(original);
        const p = aiData.problem;

        // Fix example inputs
        p.examples = p.examples.map(ex => ({
            ...ex,
            input: sanitizeExampleInput(ex.input)
        }));


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
            tags: p.tags,
            examples: p.examples,
            expected_time_complexity: p.expected_time_complexity,
            expected_auxiliary_space: p.expected_auxiliary_space,
            time_limit: p.time_limit,
            memory_limit: p.memory_limit
        });

        res.status(201).json({
            success: true,
            message: "AI problem generated",
            problem: saved
        });
    } catch (err) {
        console.error("❌ Generation failed:", err);
        res.status(500).json({
            success: false,
            message: "Generation failed",
            error: err.message
        });
    }
};

// ======================================================================
// 👍 6. Accept AI Problem
// ======================================================================
exports.acceptAiProblem = async (req, res) => {
    try {
        const { problemId } = req.params;

        const problem = await AiProblem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Not found" });

        problem.acceptedByUser = true;
        await problem.save();

        res.json({ message: "Accepted", problem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ======================================================================
// ❌ 7. Delete AI Problem
// ======================================================================
exports.deleteAiProblem = async (req, res) => {
    try {
        const { problemId } = req.params;

        const problem = await AiProblem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Not found" });

        if (problem.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await problem.deleteOne();

        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ======================================================================
// 📜 8. Get ALL AI problems
// ======================================================================
exports.getAllAiProblems = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const problems = await AiProblem.find({
            $or: [
                { createdBy: userId },
                { isPublic: true }
            ]
        });

        res.json({ problems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ======================================================================
// 🔍 9. Get Single AI Problem
// ======================================================================
exports.getAiProblemById = async (req, res) => {
    try {
        const { problemId } = req.params;

        const problem = await AiProblem.findById(problemId);
        if (!problem) return res.status(404).json({ message: "Not found" });

        res.json({ problem });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// - Keep the structure of example input and output similar to original problem (like no extra comma addition, or braces etc)