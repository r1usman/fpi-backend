// services/aiGenerator.js
import 'dotenv/config'; // if using ESM; if your project is CommonJS use require('dotenv').config()
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

/**
 * generateAiVariant(original)
 * original: mongoose document / plain object for the existing problem
 * Returns an object like:
 * {
 *   title: 'Variant title',
 *   statement: 'Full problem statement',
 *   input_spec: '...',
 *   output_spec: '...',
 *   examples: [{ input: '...', output: '...', explanation: '...' }],
 *   difficulty: 'MEDIUM',
 *   tags: ['dp','greedy']
 * }
 */
async function generateAiVariant(original) {
  // Build a strict prompt asking for JSON output
  const prompt = `
You are an assistant that generates a *new variant* of a programming contest problem. 
Use the original problem below to create a new variant that:
1) keeps the same core algorithmic idea (don't change it into a different technique).
2) changes wording, constraints and examples.
3) outputs a JSON object only, with keys: title, statement, input_spec, output_spec, examples (array), difficulty, tags.

Original problem (title and statement):
Title: ${original.title || 'No title'}
Statement: ${original.statement || original.description || 'No statement provided'}

Constraints (time/memory): time_limit=${original.time_limit || 'N/A'}, memory_limit=${original.memory_limit || 'N/A'}
Tags: ${(original.tags || []).join(', ')}

Return only valid JSON. Examples array should be [{ "input": "...", "output":"...", "explanation":"..." }].
  `;

  try {
    const resp = await client.chat.completions.create({
      model: "openai/gpt-oss-safeguard-20b:groq",
      messages: [
        { role: 'system', content: 'You are an assistant that returns ONLY JSON in a specific schema.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.2,
    });

    const raw = resp.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty model response');

    // Try parse JSON. If model wrapped in text, attempt to extract JSON substring.
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // extract JSON bracket pair
      const match = raw.match(/\{[\s\S]*\}$/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Failed to parse JSON from model response: ' + raw);
    }

    // Normalize shape
    parsed.examples = Array.isArray(parsed.examples) ? parsed.examples : [];
    parsed.title = parsed.title || (original.title ? original.title + ' (variant)' : 'AI generated problem');
    parsed.statement = parsed.statement || parsed.description || 'No statement';
    parsed.tags = parsed.tags || original.tags || [];

    return parsed;
  } catch (err) {
    console.error('generateAiVariant error:', err);
    throw err;
  }
}

module.exports = { generateAiVariant };
