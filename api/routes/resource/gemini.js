// index.js (Node.js example)
const { GoogleGenAI } = require("@google/genai");
// Add dotenv import and config
require('dotenv').config(); // Loads environment variables from .env file

// The client automatically picks up the API key from the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

async function getKeywords(transcript) {
  try {
    const prompt = `generate 4 important keywords from this text separated by space. "${transcript}"`;
    console.log(transcript);
    // Call the model to generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use a suitable model
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    console.log(response.text, "fdsafds");
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

module.exports = { getKeywords };
