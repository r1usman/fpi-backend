// Semantic question de-duplication with embeddings
// - Uses @xenova/transformers (MiniLM) to compute sentence embeddings locally (no API key)
// - Falls back to a robust text-normalization heuristic if the model isn't available

import { pipeline } from "@xenova/transformers";

// ---------- Utilities ----------
const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) throw new Error("Vector length mismatch");
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum; // vectors are normalized, so dot = cosine
};

const simpleNormalize = (text) => {
  if (text == null) return "";
  // Lowercase, remove diacritics, strip punctuation, collapse whitespace
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ") // punctuation -> space
    .replace(/\s+/g, " ")
    .trim();
};

// ---------- Embedding loader ----------
let embedder = null;
async function getEmbedder() {
  if (embedder) return embedder;
  // Model: Small, fast, good for semantic similarity
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return embedder;
}

async function embedTexts(texts) {
  const extractor = await getEmbedder();
  const outputs = [];
  for (const t of texts) {
    const res = await extractor(t, { pooling: "mean", normalize: true });
    // res.data is Float32Array
    outputs.push(res.data);
  }
  return outputs;
}

// ---------- Core de-duplication ----------
/**
 * Remove semantically similar duplicates from a list of strings.
 *
 * Options:
 * - threshold: number in [0,1]; higher = stricter uniqueness (default 0.82)
 * - fallbackOnError: use text-normalization heuristic if embeddings fail (default true)
 */
export async function dedupeQuestions(questions, options = {}) {
  const { threshold = 0.82, fallbackOnError = true } = options;

  // Coerce to array of strings and keep original order
  const items = (questions || []).map((q) => (q == null ? "" : String(q)));

  try {
    const embs = await embedTexts(items);
    const keep = [];
    const keepEmbeddings = [];
    for (let i = 0; i < items.length; i++) {
      const e = embs[i];
      let isDuplicate = false;
      for (let j = 0; j < keepEmbeddings.length; j++) {
        const sim = cosineSimilarity(e, keepEmbeddings[j]);
        if (sim >= threshold) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        keep.push(items[i]);
        keepEmbeddings.push(e);
      }
    }
    return keep;
  } catch (err) {
    if (!fallbackOnError) throw err;
    // Fallback: normalized string de-duplication (not semantic, but robust)
    const seen = new Set();
    const out = [];
    for (const q of items) {
      const key = simpleNormalize(q);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(q);
      }
    }
    return out;
  }
}
