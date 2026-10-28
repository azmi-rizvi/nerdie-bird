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
const publicSpeciesDir = path.join(__dirname, '..', '..', 'nerdie-frontend', 'public', 'species');
const backendSpeciesDir = path.join(__dirname, '..', 'uploads', 'species');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(publicSpeciesDir)) fs.mkdirSync(publicSpeciesDir, { recursive: true });
if (!fs.existsSync(backendSpeciesDir)) fs.mkdirSync(backendSpeciesDir, { recursive: true });

// Guaranteed authentic local bird photos by category
const CATEGORY_FALLBACK_IMAGES = {
  'Parrots': '/species/cockatiel.jpg',
  'Finches': '/species/zebra-finch.png',
  'Canaries': '/species/canary.jpg',
  'Raptors': '/species/barn-owl.jpg',
  'Wild Birds': '/species/blue-jay.jpg',
  'Waterfowl': '/species/mandarin-duck.jpg',
  'Softbills': '/species/keel-billed-toucan.jpg',
  'Pigeons & Doves': '/species/victoria-crowned-pigeon.jpg',
  'Default': '/species/cockatiel.jpg'
};

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

/**
 * Searches Wikipedia API and caches the authentic canonical photograph for an identified bird
 */
async function fetchAndCacheBirdPhoto(speciesName, scientificName, geminiImageUrl, categoryType) {
  try {
    const slug = speciesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `${slug}.jpg`;
    const pubDest = path.join(publicSpeciesDir, filename);
    const bkdDest = path.join(backendSpeciesDir, filename);

    // If file already exists locally, use it immediately
    if (fs.existsSync(bkdDest) && fs.statSync(bkdDest).size > 5000) {
      return `/species/${filename}`;
    }
    if (fs.existsSync(pubDest) && fs.statSync(pubDest).size > 5000) {
      try { if (!fs.existsSync(bkdDest)) fs.copyFileSync(pubDest, bkdDest); } catch(e){}
      return `/species/${filename}`;
    }

    let downloadUrl = null;

    // 1. Fetch canonical image from Wikipedia API with redirects=1
    const searchTerms = [scientificName, speciesName].filter(t => t && typeof t === 'string' && t.trim().length > 2);
    for (const term of searchTerms) {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=${encodeURIComponent(term.trim())}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=900&format=json`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'FeatherCareAvianApp/1.0 (https://feathercare.org; support@feathercare.org)' }
        });
        if (res.ok) {
          const data = await res.json();
          const page = Object.values(data.query?.pages || {}).find(p => !('missing' in p) && p.thumbnail?.source);
          if (page && page.thumbnail?.source) {
            downloadUrl = page.thumbnail.source;
            break;
          }
        }
      } catch (e) {
        console.warn(`Wikipedia image search for "${term}":`, e.message);
      }
    }

    // 2. If Wikipedia search didn't yield a thumbnail, check Gemini's image URL
    if (!downloadUrl && geminiImageUrl && typeof geminiImageUrl === 'string' && geminiImageUrl.startsWith('http')) {
      downloadUrl = geminiImageUrl;
    }

    // 3. Download and cache locally
    if (downloadUrl) {
      const imgRes = await fetch(downloadUrl, {
        headers: { 'User-Agent': 'FeatherCareAvianApp/1.0 (https://feathercare.org; support@feathercare.org)' }
      });
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        if (buffer.length > 5000) {
          if (fs.existsSync(publicSpeciesDir)) {
            try { fs.writeFileSync(pubDest, buffer); } catch(e){}
          }
          if (!fs.existsSync(backendSpeciesDir)) fs.mkdirSync(backendSpeciesDir, { recursive: true });
          fs.writeFileSync(bkdDest, buffer);
          console.log(`[Auto-Cached Photo] Cached canonical photo for "${speciesName}" -> /species/${filename}`);
          return `/species/${filename}`;
        }
      }
    }
  } catch (err) {
    console.warn(`Could not cache canonical photo for "${speciesName}":`, err.message);
  }

  return null;
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

  // Save image to uploads folder for serving
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
You are an expert avian biologist, ornithologist, and bird identifier.
Analyze the provided ${uploadedFile ? 'image' : ''}${uploadedFile && description ? ' and ' : ''}${description ? `description: "${description}"` : ''}.
Identify the bird species based strictly on visible morphological features (plumage, beak shape, eye markings, crest, coloration, size) or descriptive traits.

CRITICAL REQUIREMENT:
The identified bird MUST be an actual, real, extant biological species recognized by scientific taxonomy (such as the IOC World Bird List). NEVER invent fictional or hybrid bird names.

Respond with ONLY a valid JSON object matching this schema:
{
  "species_name": "Standard real common species name (or 'Unknown Bird Species' if not a recognizable bird)",
  "scientific_name": "Valid Latin binomial name (e.g. 'Nymphicus hollandicus', 'Melopsittacus undulatus', 'Cardinalis cardinalis')",
  "type": "Parrots | Finches | Wild Birds | Softbills | Raptors | Waterfowl | Canaries | Pigeons & Doves",
  "confidence": "High, Medium, or Low",
  "description": "Comprehensive physical description and key visual identifying features that confirm this ID",
  "fun_facts": [
    "Interesting behavioral or biological fact 1",
    "Interesting behavioral or biological fact 2"
  ],
  "habitat": "Natural geographic origin and wild habitat",
  "diet": "Recommended domestic diet (pellets, seeds, greens) or natural wild diet",
  "cage_setup": "Cage dimensions, wire spacing, perches, and environmental setup",
  "social_needs": "Flock dynamic, daily interaction requirements, and companionship",
  "lifespan": "Typical lifespan (e.g., '15 - 25 years')",
  "image_url": "Direct, authentic public photo URL of this exact bird species to show to the user (e.g. from Wikimedia Commons or Wikipedia). Return ONLY a direct photo link of this bird species, never random scenery, drones, or people."
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
        scientific_name: matchedDb.scientific_name || '',
        type: matchedDb.type || 'Companion Bird',
        confidence: 'Medium (Database Fallback)',
        description: `Identified via database catalog matching keyword: "${matchedDb.name}". ` + matchedDb.fun_facts,
        fun_facts: [matchedDb.fun_facts, `Social needs: ${matchedDb.social_needs}`],
        habitat: matchedDb.habitat,
        diet: matchedDb.diet,
        cage_setup: matchedDb.cage_setup,
        social_needs: matchedDb.social_needs,
        lifespan: matchedDb.lifespan,
        image_url: matchedDb.image_url,
        fallback: true
      };
      modelUsed = 'database-fallback';
    } else {
      return sendGeminiError(res, error);
    }
  }

  const speciesName = (aiResult.species_name || 'Unknown Bird').trim();
  const scientificName = (aiResult.scientific_name || '').trim();
  const categoryType = (aiResult.type || 'Wild Birds').trim();

  // Check if species exists in local database
  let dbSpecies = db.prepare('SELECT * FROM species WHERE LOWER(name) = LOWER(?)').get(speciesName);
  if (!dbSpecies && scientificName) {
    dbSpecies = db.prepare('SELECT * FROM species WHERE LOWER(scientific_name) = LOWER(?)').get(scientificName);
  }

  // Cache canonical photograph for this species from Wikipedia / Gemini
  const localCanonicalImageUrl = await fetchAndCacheBirdPhoto(
    speciesName,
    scientificName,
    aiResult.image_url,
    categoryType
  );

  // AUTO-SAVE TO DATABASE IF NOT PRESENT
  let autoSavedToDb = false;
  if (!dbSpecies && speciesName.toLowerCase() !== 'unknown bird species' && speciesName.toLowerCase() !== 'unknown bird') {
    try {
      const funFactsStr = Array.isArray(aiResult.fun_facts)
        ? aiResult.fun_facts.join(' ')
        : (aiResult.fun_facts || 'Fascinating and beautiful bird species.');

      const habitat = String(aiResult.habitat || 'Varied natural habitats').trim();
      const diet = String(aiResult.diet || 'Nutritious balanced diet').trim();
      const cageSetup = String(aiResult.cage_setup || 'Spacious enclosure with safe natural perches').trim();
      const socialNeeds = String(aiResult.social_needs || 'Daily social interaction and mental stimulation').trim();
      const lifespan = String(aiResult.lifespan || '10 - 20 years').trim();

      const insertStmt = db.prepare(`
        INSERT INTO species (name, type, habitat, diet, cage_setup, social_needs, lifespan, fun_facts, image_url, scientific_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertRes = insertStmt.run(
        speciesName,
        categoryType,
        habitat,
        diet,
        cageSetup,
        socialNeeds,
        lifespan,
        funFactsStr,
        localCanonicalImageUrl,
        scientificName || null
      );

      dbSpecies = db.prepare('SELECT * FROM species WHERE id = ?').get(insertRes.lastInsertRowid);
      autoSavedToDb = true;
      console.log(`[Auto-Saved to Catalog] Newly identified species "${speciesName}" (${scientificName}) auto-added to database [ID: ${dbSpecies.id}]`);
    } catch (saveErr) {
      console.warn(`[Auto-Save Species Failed] "${speciesName}":`, saveErr.message);
      dbSpecies = db.prepare('SELECT * FROM species WHERE LOWER(name) = LOWER(?)').get(speciesName);
    }
  }

  // Determine final image URL to return to frontend:
  // If user uploaded an image, display their uploaded image.
  // If text-only identification, prioritize the authentic canonical photo of the identified bird!
  let finalImageUrl = uploadedImageUrl;
  if (!finalImageUrl) {
    if (localCanonicalImageUrl) {
      finalImageUrl = localCanonicalImageUrl;
    } else if (typeof aiResult.image_url === 'string' && aiResult.image_url.startsWith('http')) {
      finalImageUrl = aiResult.image_url;
    } else if (dbSpecies?.image_url) {
      finalImageUrl = dbSpecies.image_url;
    } else {
      finalImageUrl = CATEGORY_FALLBACK_IMAGES[categoryType] || CATEGORY_FALLBACK_IMAGES['Default'];
    }
  }

  const funFactsArray = Array.isArray(aiResult.fun_facts)
    ? aiResult.fun_facts
    : [aiResult.fun_facts].filter(Boolean);

  return res.json({
    species_name: speciesName,
    scientific_name: scientificName || dbSpecies?.scientific_name || null,
    confidence: aiResult.confidence,
    description: aiResult.description,
    fun_facts: funFactsArray,
    habitat: aiResult.habitat || dbSpecies?.habitat || 'Not specified',
    diet: aiResult.diet || dbSpecies?.diet || 'Formulated pellets and fresh greens',
    species: speciesName,
    species_id: dbSpecies?.id || null,
    auto_saved_to_db: autoSavedToDb,
    rationale: aiResult.description,
    image_url: finalImageUrl,
    web_image_url: (typeof aiResult.image_url === 'string' && aiResult.image_url.startsWith('http')) ? aiResult.image_url : null,
    gemini_image_url: (typeof aiResult.image_url === 'string' && aiResult.image_url.startsWith('http')) ? aiResult.image_url : null,
    local_image_url: localCanonicalImageUrl || null,
    type: dbSpecies?.type || categoryType,
    ai_generated: !aiResult.fallback,
    ai_model: modelUsed
  });
});

module.exports = router;
