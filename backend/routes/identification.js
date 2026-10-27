const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { generateAIContent, sendGeminiError } = require('../utils/gemini');

const router = express.Router();
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 2 },
  fileFilter: (req, file, callback) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
      return callback(new Error('Unsupported image type. Please upload a JPEG, PNG, or WEBP image.'));
    }
    callback(null, true);
  }
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

function isSupportedImage(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (mimeType === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === 'image/webp') {
    return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return true;
}

function validResult(data) {
  return data && typeof data === 'object' &&
    typeof data.species_name === 'string' && data.species_name.trim() &&
    typeof data.confidence === 'string' &&
    typeof data.description === 'string';
}

router.post('/', (req, res, next) => {
  upload(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image is too large. Please upload an image no larger than 10 MB.' });
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Please upload one image at a time.' });
    }
    return res.status(415).json({ error: error.message });
  });
}, async (req, res) => {
  const uploadedFiles = [...(req.files?.photo || []), ...(req.files?.image || [])];
  const uploadedFile = req.files?.photo?.[0] || req.files?.image?.[0];
  const description = String(req.body?.description || req.body?.notes || '').trim();

  if (!uploadedFile && !description) {
    return res.status(400).json({ error: 'Please provide either an image file or a text description to identify.' });
  }
  if (description.length > 2000) {
    return res.status(400).json({ error: 'Please keep the bird description under 2,000 characters.' });
  }
  if (uploadedFiles.some(file => !isSupportedImage(file.buffer, file.mimetype))) {
    return res.status(415).json({ error: 'The uploaded file is not a valid JPEG, PNG, or WEBP image. Please choose another image.' });
  }

  // Save image to uploads folder for serving and history
  let uploadedImageUrl = null;
  if (uploadedFile) {
    try {
      const ext = path.extname(uploadedFile.originalname) ||
        (uploadedFile.mimetype === 'image/png' ? '.png' : uploadedFile.mimetype === 'image/webp' ? '.webp' : '.jpg');
      const filename = `bird-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, uploadedFile.buffer);
      uploadedImageUrl = `/uploads/${filename}`;
    } catch (saveErr) {
      console.warn('Could not save uploaded image to disk:', saveErr);
    }
  }

  // Multimodal contents array for Gemini
  const contents = [];
  if (uploadedFile) {
    contents.push({
      inlineData: {
        mimeType: uploadedFile.mimetype || 'image/jpeg',
        data: uploadedFile.buffer.toString('base64')
      }
    });
  }

  const promptText = `
You are an expert avian biologist and bird identifier.
Analyze the provided ${uploadedFile ? 'image' : ''}${uploadedFile && description ? ' and ' : ''}${description ? `description: "${description}"` : ''}.
Identify the bird species based strictly on visible morphological features (plumage, beak shape, eye markings, crest, coloration, size).
Provide factual care, natural habitat, and diet details.

Respond with ONLY a valid JSON object matching this schema:
{
  "species_name": "Common species name (or 'Unknown Bird Species' if not a recognizable bird)",
  "confidence": "High, Medium, or Low",
  "description": "Comprehensive physical description and key visual identifying features that confirm this ID",
  "fun_facts": [
    "Interesting behavioral or biological fact 1",
    "Interesting behavioral or biological fact 2"
  ],
  "habitat": "Natural geographic origin and wild habitat",
  "diet": "Recommended domestic diet (pellets, seeds, greens) or natural wild diet"
}`;

  contents.push(promptText);

  let aiResult = null;
  let modelUsed = null;

  try {
    const result = await generateAIContent({
      contents,
      responseMimeType: 'application/json',
      timeoutMs: 30000
    });

    aiResult = result.data;
    modelUsed = result.modelUsed;

    if (!validResult(aiResult)) {
      throw new Error('Gemini returned incomplete identification details.');
    }
  } catch (error) {
    console.warn('[Identification AI Failed]:', error.message);

    // Limit/network fallback: try matching known database species if description matches
    const searchTerms = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    let matchedDb = null;
    for (const term of searchTerms) {
      matchedDb = db.prepare('SELECT * FROM species WHERE LOWER(name) LIKE ?').get(`%${term}%`);
      if (matchedDb) break;
    }

    if (matchedDb) {
      aiResult = {
        species_name: matchedDb.name,
        confidence: 'Medium (Database Fallback)',
        description: `Identified via database catalog matching keyword: "${matchedDb.name}". ` + matchedDb.fun_facts,
        fun_facts: [matchedDb.fun_facts, `Social needs: ${matchedDb.social_needs}`],
        habitat: matchedDb.habitat,
        diet: matchedDb.diet,
        fallback: true
      };
      modelUsed = 'database-fallback';
    } else {
      // If no fallback match could be found, return the structured Gemini error
      return sendGeminiError(res, error);
    }
  }

  const speciesName = (aiResult.species_name || 'Unknown Bird').trim();

  // Check if species exists in local database to attach species_id
  const dbSpecies = db.prepare(`
    SELECT * FROM species
    WHERE LOWER(name) = LOWER(?) OR LOWER(name) LIKE LOWER(?)
    LIMIT 1
  `).get(speciesName, `%${speciesName}%`);

  const funFactsArray = Array.isArray(aiResult.fun_facts)
    ? aiResult.fun_facts
    : [aiResult.fun_facts].filter(Boolean);

  return res.json({
    species_name: speciesName,
    confidence: aiResult.confidence,
    description: aiResult.description,
    fun_facts: funFactsArray,
    habitat: aiResult.habitat || dbSpecies?.habitat || 'Not specified',
    diet: aiResult.diet || dbSpecies?.diet || 'Formulated pellets and fresh greens',
    species: speciesName,
    species_id: dbSpecies?.id || null,
    rationale: aiResult.description,
    image_url: uploadedImageUrl || dbSpecies?.image_url || null,
    type: dbSpecies?.type || 'Companion Bird',
    ai_generated: !aiResult.fallback,
    ai_model: modelUsed
  });
});

module.exports = router;
