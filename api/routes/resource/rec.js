const { AssemblyAI } = require("assemblyai");
const multer = require("multer");
const { getKeywords } = require("./gemini");
const { googleSearch } = require("./res");

// Set up disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const client = new AssemblyAI({
  apiKey: "ce16113c07824b2d87804d063f4c21bb",
});
async function getResources(req, res) {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    // Read the file from disk
    const filePath = req.file.path;
    const params = {
      audio: filePath,
      speech_model: "universal",
    };
    const transcript = await client.transcripts.transcribe(params);

    if (!transcript.text || transcript.text.length < 12) {
      return res.json([]);
    }

    const extract = await getKeywords(transcript.text);
    console.log(extract);
    const results = await googleSearch(extract);
    const updResults = results.map((result) => {
      return {
        title: result.title,
        link: result.link,
      };
    });

    res.json({ updResults });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Transcription failed", details: error.message });
  }
}

module.exports = { upload, getResources };
