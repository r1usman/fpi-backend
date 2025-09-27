const axios = require("axios");

async function googleSearch(query) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1`,
      {
        params: {
          q: query,
          key: "AIzaSyCUcZVBa5lanJjPfwlPV7wdzFdHTK_CQi4",
          cx: "c3c5e0e9a48c1428a",
          num: 5, // Number of results
        },
      }
    );
    return response.data.items || [];
  } catch (error) {
    console.error("Google Search Error:", error.message);
    return [];
  }
}

module.exports = { googleSearch };
