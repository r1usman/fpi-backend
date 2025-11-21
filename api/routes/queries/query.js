// Controller: getQueries
// This controller expects a JSON body with { queries: [ ... ] }
// and responds with { unique_queries: [ ... ] }
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

// The client automatically picks up the API key from the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

const querySchema = {
  type: "object",
  properties: {
    unique_queries: {
      type: "array",
      description: "A list of distinct, self-contained questions",
      items: {
        type: "string",
      },
    },
  },
  required: ["unique_queries"],
};

async function getQueries(req, res) {
  try {
    const { queries } = req.body;
    // console.log(queries, "Received queries");
    if (!Array.isArray(queries)) {
      return res
        .status(400)
        .json({ error: "`queries` must be an array in request body" });
    }

    const prompt = `student_questions = ${JSON.stringify(
      queries
    )}\nremove the queries with same semantics and only return queries such that multiple queries with same semantics appear only once\nreturn the response as a JSON string with key unique_queries containing the list of unique queries.`;

    // Call the model to generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: querySchema,
      },
    });

    let unique_queries = [];
    try {
      const parsed = JSON.parse(response.text);
      unique_queries = parsed.unique_queries || [];
    } catch (parseErr) {
      console.error(
        "Failed to parse AI response as JSON:",
        parseErr,
        response.text
      );
      // fallback: return empty array
      unique_queries = [];
    }
    console.log(unique_queries, "Unique queries generated");

    return res.json({ unique_queries });
  } catch (error) {
    console.error("Error generating content:", error);
    return res.status(500).json({ error: "Failed to generate unique queries" });
  }
}

module.exports = { getQueries };
