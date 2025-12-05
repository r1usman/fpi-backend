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
//     const prompt = `
// You MUST follow a 2-stage generation process:

// STAGE 1 — INTERNAL REASONING (do NOT output JSON)
// - add prefix or postfix to original problem name to differentiate it
// - Different story/theme, make sure this accurately defines a NEW problem.
// - Think step-by-step.
// - Construct the problem.
// - Generate examples.
// - Verify examples by hand.
// - Re-check logic and constraints.
// - Confirm that all samples match the rules.

// DO NOT output the reasoning.

// STAGE 2 — OUTPUT JSON (in <json></json>)
// Return ONLY valid JSON.

// <json>
// {
//    "problem": {
//       "name": "",
//       "difficulty": "${original.difficulty}",
//       "description": "",
//       "input": "",
//       "output": "",
//       "note": "",
//       "tags": [],
//       "examples": [
//          {"input": "", "output": "", "explanation": ""}
//       ],
//       "expected_time_complexity": "",
//       "expected_auxiliary_space": "",
//       "time_limit": "1 second",
//       "memory_limit": "256 MB"
//    }
// }
// </json>

// RULES:
// - ALL examples must be manually checked in STAGE 1.
// - NO contradictions.
// - NO impossible outputs.
// - No reuse of original examples.
// - Must be mathematically sound.


// Original Problem:
// ${original.name}
// ${original.description.substring(0, 300)}...
// Tags: ${original.tags?.join(", ") || "None"}
// `;

prompt = `
You MUST follow a 2-stage generation process:

STAGE 1 — INTERNAL CHECKING (DO NOT OUTPUT ANY OF THIS)
- Create a NEW problem based on the original, but with a different theme or story.
- The new problem MUST have clear, deterministic, mathematically valid rules.
- DO NOT reuse the original problem’s examples.
- When designing the new problem, ensure:
  • Rules are consistent and unambiguous.
  • Examples follow the rules exactly.
  • Inputs and outputs are realistic.
  • No contradictions or exceptions.
- Test all examples privately and ensure correctness.
- DO NOT output or reveal any reasoning, thinking, or calculations from Stage 1.

STAGE 2 — OUTPUT JSON ONLY (wrapped in <json></json>)
Return ONLY valid JSON in the following format:

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
- The new problem must be mathematically sound.
- All examples must be correct and manually verified internally.
- No contradictions or ambiguous rules.
- Do NOT output any chain-of-thought.
- Only output JSON in Stage 2.

Original Problem:
${original.name}
${original.description.substring(0, 300)}...
Tags: ${original.tags?.join(", ") || "None"}

`

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
  "Qwen/Qwen3-VL-235B-A22B-Thinking:novita",
  "moonshotai/Kimi-K2-Thinking:novita",
  
  
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

// function sanitizeExampleInput(exampleInput) {
//     let parts = exampleInput.trim().split(/\s+/).map(Number);

//     // Remove the example number prefix (e.g., "1 4" → ["1","4"])
//     // If first number is count + 1, reduce it
//     if (parts.length === 2 && parts[0] <= 2 && parts[1] <= 9) {
//         // Single-digit type
//         return `${parts[1]}`;
//     }

//     // --- Array type ---
//     // If format is like: "4 1 5 10 15"
//     let n = parts[0];

//     if (parts.length === n + 1) {
//         // Already in correct compact format
//         return `${n}\n${parts.slice(1).join(" ")}`;
//     }

//     // If input already provided in two lines originally but merged
//     if (parts.length > 2) {
//         // Try to recover: first value is n
//         n = parts[0];
//         let arr = parts.slice(1, 1 + n);

//         return `${n}\n${arr.join(" ")}`;
//     }

//     // Fallback → return original
//     return exampleInput.trim();
// }

function sanitizeExampleInput(exampleInput) {
    if (!exampleInput) return "";

    // Convert all whitespace to spaces
    let raw = exampleInput.replace(/\s+/g, " ").trim();

    // Extract all numbers
    let nums = raw.split(" ").filter(x => x.length > 0 && !isNaN(x)).map(Number);

    if (nums.length === 0) return raw;

    // =============================================================
    // CASE 1 — SINGLE-DIGIT PROBLEMS
    // Example formats:
    // "1 5"
    // "5"
    // "1\n5"
    // =============================================================
    if (nums.length === 2 && nums[0] <= 5 && nums[1] <= 9) {
        // first number is example index, second is value
        return String(nums[1]);
    }
    if (nums.length === 1 && nums[0] <= 9) {
        return String(nums[0]);
    }

    // =============================================================
    // CASE 2 — TWO-DIGIT PROBLEMS (10–99)
    // Examples:
    // "1 14"
    // "14"
    // "Example: 2 25"
    // =============================================================
    if (nums.length === 2 && nums[1] >= 10 && nums[1] <= 99) {
        return String(nums[1]);
    }
    if (nums.length === 1 && nums[0] >= 10 && nums[0] <= 99) {
        return String(nums[0]);
    }

    // =============================================================
    // CASE 3 — ARRAY PROBLEMS
    // Examples:
    // "4 1 5 10 15"
    // "4\n1 5 10 15"
    // =============================================================
    let n = nums[0];

    if (nums.length === n + 1) {
        // Valid array with length prefix
        return `${n}\n${nums.slice(1).join(" ")}`;
    }

    if (nums.length > 2 && nums.length - 1 >= n) {
        // Attempt to repair broken merge
        let arr = nums.slice(1, 1 + n);
        return `${n}\n${arr.join(" ")}`;
    }

    // =============================================================
    // FALLBACK → return cleaned integer list as space-separated
    // =============================================================
    return nums.join(" ");
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

// ========================================================
// ========================================================
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ========================================================
// ========================================================