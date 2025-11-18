// index.js (Node.js example)
const { GoogleGenAI } = require("@google/genai");
// Add dotenv import and config
require("dotenv").config(); // Loads environment variables from .env file

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
async function getQueries(student_questions) {
  try {
    const prompt = `student_questions = ${student_questions}\nremove the queries with same semantics and only return queries such that multiple queries with same semantics appear only once
return the response as a JSON string with key unique_queries containing the list of unique queries, for example "unique_queries": [
    "first unique query",
    "second unique query",
    "third unique query"
  ].`;
    // Call the model to generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use a suitable model
      contents: prompt,
      config: {
        // Set to enforce raw JSON string output
        responseMimeType: "application/json",
        // Provide the schema blueprint
        responseSchema: querySchema,
      },
    });
    const { unique_queries } = JSON.parse(response.text);
    console.log(JSON.parse(response.text), "fdsafds");
    return unique_queries;
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

// module.exports = { getKeywords };

/* {
student_questions = [
  "At what temperature does pure water boil when measured at standard atmospheric pressure?",
  "Can you describe the primary function of chlorophyll in green foliage?",
  "Would you please detail the essential steps required for a plant to convert light energy into chemical energy?",
  
  "Could you tell me what the boiling point is for H₂O at sea level?",
  "What is the mechanism by which plants synthesize their own food using sunlight?",
  "What is the thermal point at which liquid water turns into a gas?",
  "What are the core differences that exist between the mitochondrion and the chloroplast?",
  
  "Could you explain how the process of photosynthesis is actually carried out in a typical plant cell?",
  "What is the molecular formula for water, and exactly how many atoms does that molecule contain?",
  "Can you explain the cellular procedure where plants create glucose from carbon dioxide and water?",
];
remove the queries with same semantics and only return queries such that multiple queries with same semantics appear only once
return the response as a JSON string

  "unique_queries": [
    "At what temperature does pure water boil when measured at standard atmospheric pressure?",
    "Can you describe the primary function of chlorophyll in green foliage?",
    "Would you please detail the essential steps required for a plant to convert light energy into chemical energy?",
    "What are the core differences that exist between the mitochondrion and the chloroplast?",
    "What is the molecular formula for water, and exactly how many atoms does that molecule contain?"
  ]
} */

const student_questions = [
  "At what temperature does pure water boil when measured at standard atmospheric pressure?",
  "Can you describe the primary function of chlorophyll in green foliage?",
  "Would you please detail the essential steps required for a plant to convert light energy into chemical energy?",
  "Could you tell me what the boiling point is for H₂O at sea level?",
  "What is the mechanism by which plants synthesize their own food using sunlight?",
  "What is the thermal point at which liquid water turns into a gas?",
  "What are the core differences that exist between the mitochondrion and the chloroplast?",
  "Could you explain how the process of photosynthesis is actually carried out in a typical plant cell?",
  "What is the molecular formula for water, and exactly how many atoms does that molecule contain?",
  "Can you explain the cellular procedure where plants create glucose from carbon dioxide and water?",
];
getQueries(student_questions);
