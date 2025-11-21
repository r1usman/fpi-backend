const express = require('express');
const route = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY
// FIX: Changed the deprecated preview model name to the current stable model name to resolve the 404 error.
const modelName = "gemini-2.5-flash";
const baseApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

const systemInstruction = "You are a highly concise assistant. Answer the user's question in a single, short sentence. Do not elaborate.";
const { blogPostIdeasPrompt, blogSummaryPrompt } = require("../utils/Help")

async function queryGemini(prompt, type) {
    if (!apiKey) {
        throw new Error("API Key is missing. Please set the 'apiKey' variable.");
    }

    // 1. Construct the request payload
    const payload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        systemInstruction: {
            parts: [{
                text: type ? "" : systemInstruction
            }]
        },
        generationConfig: {
            temperature: 0.5
        }
    };

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            // 2. Make the POST request to the API
            const response = await fetch(baseApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // 3. Process the response and extract text
                const result = await response.json();
                const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                return generatedText || "No content generated.";
            }

            // If response is not ok, throw error to trigger retry logic
            throw new Error(`HTTP Error ${response.status}`);

        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error(`Failed to query Gemini after ${maxAttempts} attempts: ${error.message}`);
            }
            // Wait for exponential backoff (1s, 2s, 4s...)
            const delay = Math.pow(2, attempts) * 1000;
            // console.log(`Attempt ${attempts} failed. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Define the Express POST endpoint for chat queries
route.post('/', async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: "Please provide a valid 'question' in the request body." });
    }

    try {
        const answer = await queryGemini(question);
        res.json({
            query: question,
            answer: answer
        });

    } catch (error) {
        console.error("Endpoint Error:", error.message);
        res.status(500).json({ error: "Failed to process query.", details: error.message });
    }
});

route.post("/Ideas", async (req, res) => {
    try {
        const { topics } = req.body;

        if (!topics) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const prompt = blogPostIdeasPrompt(topics);

        // const response = await ai
        //     .getGenerativeModel({ model: "gemini-2.0-flash-lite" })
        //     .generateContent(prompt);



        const rawText = await queryGemini(prompt);

        // Clean output: remove markdown formatting or code fences
        const cleanedText = rawText
            .replace(/^```json\s*/i, "") // remove starting ```json
            .replace(/```$/i, "")        // remove ending ```
            .trim();

        // Parse safely
        const data = JSON.parse(cleanedText);

        res.status(200).json(data);
    } catch (error) {
        console.error("Error generating blog post ideas:", error);
        res.status(500).json({
            message: "Failed to generate blog post ideas",
            error: error.message,
        });
    }

})

route.post("/Blog", async (req, res) => {
    try {
        const { title, tone } = req.body;

        if (!title || !tone) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const prompt = `
      Write a markdown-formatted blog post titled "${title}".
      Use a ${tone} tone.
      Include an introduction, subheadings, code examples if relevant and conclusion.
      Make it SEO-friendly, readable, and engaging.
    `;

        const rawText = await queryGemini(prompt, "Blog");

        res.status(200).json({ content: rawText });
    } catch (error) {
        console.error("Blog generation error:", error);
        res.status(500).json({
            message: "Failed to generate blog post",
            error: error.message,
        });
    }
})


route.post("/PostSummary", async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const prompt = blogSummaryPrompt(content);
        const rawText = await queryGemini(prompt);
        const cleanedText = rawText
            .replace(/^```json\s*/, "") // remove starting ```json
            .replace(/```$/, "") // remove ending ```
            .trim(); // remove extra space
        const data = JSON.parse(cleanedText);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            message: "Failed to generate blog post summary",
            error: error.message,
        });
    }
})



module.exports = route