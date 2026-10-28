const path = require('path');
const dns = require('dns');

// Prioritize IPv4 to avoid Windows IPv6 resolution latency
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[FeatherCare AI] Warning: GEMINI_API_KEY is not set in environment.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// High-speed Flash models with verified fast response times
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash'
];

/**
 * Timeout wrapper for async promises
 */
function withTimeout(promise, ms = 20000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Gemini AI operation timed out after ${ms}ms`);
      err.code = 'TIMEOUT';
      err.status = 504;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

class GeminiServiceError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.status = status;
  }
}

function toGeminiServiceError(error) {
  if (error instanceof GeminiServiceError) {
    return error;
  }
  const msg = error?.message || '';
  if (msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('429')) {
    return new GeminiServiceError('RATE_LIMIT_EXCEEDED', 'Gemini AI rate limit reached. Please wait a moment and try again.', 429);
  }
  if (msg.includes('API key not valid') || msg.includes('AI_NOT_CONFIGURED')) {
    return new GeminiServiceError('AI_NOT_CONFIGURED', 'Invalid or missing GEMINI_API_KEY in the backend environment.', 503);
  }
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT' || msg.includes('timeout')) {
    return new GeminiServiceError('TIMEOUT', 'Gemini AI operation timed out.', 504);
  }
  if (error?.code === 'MALFORMED_RESPONSE') {
    return new GeminiServiceError('MALFORMED_RESPONSE', 'Invalid response received from Gemini AI.', 502);
  }
  return new GeminiServiceError('AI_PROVIDER_ERROR', 'Gemini AI provider encountered an error.', 502);
}

/**
 * Robust JSON extraction helper from AI text response
 */
function extractJSON(text) {
  if (!text) return null;
  const cleaned = text.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 2. Fenced code block ```json ... ```
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (err) {}
    }

    // 3. Substring between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (err) {}
    }

    // 4. Substring between first [ and last ]
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch (err) {}
    }

    const err = new Error('Could not parse valid JSON from AI response.');
    err.code = 'MALFORMED_RESPONSE';
    throw err;
  }
}

/**
 * Generate AI content with automatic model fallback
 */
async function generateAIContent({ contents, responseMimeType = 'application/json', responseSchema, systemInstruction, timeoutMs = 20000 }) {
  if (!ai || !apiKey) {
    const error = new GeminiServiceError(
      'AI_NOT_CONFIGURED',
      'Gemini AI is not configured. Set GEMINI_API_KEY in the backend environment.',
      503
    );
    throw error;
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config = {};
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (responseSchema) {
        config.responseSchema = responseSchema;
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
      console.warn(`[FeatherCare AI] Model ${model} request error: ${err.message || err}. Trying next candidate...`);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed to generate content.');
}

/**
 * Standard error response handler for Gemini API errors
 */
function sendGeminiError(res, error) {
  console.error('[FeatherCare AI Error]:', error);

  const status = error.status || (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const msg = error.message || 'Gemini AI service error';

  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({
      error: 'Gemini AI rate limit reached. Please wait a moment and try again.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  if (error.code === 'TIMEOUT' || status === 504 || msg.includes('timed out')) {
    return res.status(504).json({
      error: 'Gemini AI request timed out. Please check your connection and try again.',
      code: 'GATEWAY_TIMEOUT'
    });
  }

  return res.status(status).json({
    error: error.message || 'An error occurred while communicating with Gemini AI.',
    code: error.code || 'AI_ERROR'
  });
}

module.exports = {
  ai,
  generateAIContent,
  extractJSON,
  sendGeminiError,
  toGeminiServiceError,
  GeminiServiceError
};
