// Controller to dedupe questions from request body
// Expects JSON: { questions: string[] }
// Responds: { unique: string[], count: number }

import { dedupeQuestions } from "./index.js";

export async function handleDedupe(req, res) {
  try {
    const { queries } = req.body ?? {};
    console.log(queries);
    if (!Array.isArray(queries)) {
      return res.status(400).json({
        error: "Invalid payload: body must be JSON with an array 'questions'",
        example: {
          questions: ["What is photosynthesis?", "How do plants make food?"],
        },
      });
    }

    // dedupeQuestions already coerces items to strings; we keep original order
    const unique_queries = await dedupeQuestions(queries, { threshold: 0.52 });
    return res.json({ unique_queries });
  } catch (err) {
    console.error("/api/dedupe failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
