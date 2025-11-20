// const axios = require('axios');

// exports.validateTestcases = async (originalProblem, examples) => {
//   const valid = [];

//   for (const ex of examples) {
//     const submission = await axios.post('https://judge0-ce.p.rapidapi.com/submissions', {
//       language_id: 71, // e.g., Python 3
//       source_code: originalProblem.solutions[0].code,
//       stdin: ex.input,
//       expected_output: ex.output
//     }, {
//       headers: {
//         'x-rapidapi-key': process.env.RAPIDAPI_KEY,
//         'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
//       }
//     });

//     const result = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/${submission.data.token}`, {
//       headers: {
//         'x-rapidapi-key': process.env.RAPIDAPI_KEY,
//         'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
//       }
//     });

//     if (result.data.status.id === 3) { // 3 = Accepted
//       valid.push(ex);
//     }
//   }

//   return valid;
// };

// services/judge0Validator.js
const fetch = require('node-fetch'); // npm install node-fetch@2 if needed

/**
 * Simple fallback: ensure examples array has objects with input and output strings.
 * If JUDGE0_API_KEY is present, you can optionally run the sample on Judge0 to validate outputs.
 */
async function validateTestcases(original, examples = []) {
  // Basic shape validation
  const safeExamples = (examples || []).filter(ex => ex && typeof ex.input === 'string' && typeof ex.output === 'string');

  if (safeExamples.length === 0) {
    // Provide a default example based on original (best effort)
    return [{
      input: original.examples && original.examples[0] && original.examples[0].input || '1 2 3',
      output: original.examples && original.examples[0] && original.examples[0].output || '6',
      explanation: original.examples && original.examples[0] && original.examples[0].explanation || ''
    }];
  }

  // OPTIONAL: If you have a Judge0 API setup and want to truly run examples, enable the block below.
  if (process.env.JUDGE0_API_KEY) {
    try {
      // Example: use RapidAPI Judge0 endpoint (adjust headers and URL depending on provider)
      const host = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
      const validated = [];

      for (const ex of safeExamples) {
        // This sample does not execute the user's original solution.
        // For realistic validation you would need a correct reference solution to run against.
        // So we only do minimal checks here (non-empty input/output).
        validated.push(ex);
      }

      return validated;
    } catch (err) {
      console.warn('Judge0 validation failed, using fallback examples', err);
      return safeExamples;
    }
  }

  return safeExamples;
}

module.exports = { validateTestcases };
