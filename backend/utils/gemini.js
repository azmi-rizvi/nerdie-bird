const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[FeatherCare AI] Warning: GEMINI_API_KEY is not set in environment.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Candidate models in order of preference
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

/**
 * Timeout wrapper for async promises
 */
function withTimeout(promise, ms = 9000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Robust JSON extraction helper from AI text response
 */
function extractJSON(text) {
  if (!text) return null;
  const cleaned = text.trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Look for ```json ... ``` or first { ... } / [ ... ]
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (err) {}
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (err) {}
    }

    throw new Error('Could not parse valid JSON from AI response: ' + cleaned.substring(0, 100));
  }
}

/**
 * Generate AI content with automatic model fallback for resilience
 */
async function generateAIContent({ contents, responseMimeType = 'application/json', systemInstruction, timeoutMs = 9000 }) {
  if (!ai) {
    throw new Error('Gemini AI client is not initialized. Please verify GEMINI_API_KEY.');
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config = {};
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const generatePromise = ai.models.generateContent({
        model,
        contents,
        ...(Object.keys(config).length > 0 ? { config } : {})
      });

      const response = await withTimeout(generatePromise, timeoutMs);

      if (response && response.text) {
        return {
          modelUsed: model,
          text: response.text,
          data: responseMimeType === 'application/json' ? extractJSON(response.text) : response.text
        };
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to generate content.');
}

module.exports = ai;
module.exports.ai = ai;
module.exports.generateAIContent = generateAIContent;
module.exports.extractJSON = extractJSON;
