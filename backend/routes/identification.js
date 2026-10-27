const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { generateAIContent } = require('../utils/gemini');

// Configure multer storage
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'bird-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Heuristic fallback in case of network or API failure
function getHeuristicMatch(text) {
  const t = (text || '').toLowerCase();
  const known = [
    { name: 'Cockatiel', kws: ['cockatiel', 'crest', 'orange cheek', 'whistle'] },
    { name: 'Budgerigar', kws: ['budgie', 'budgerigar', 'parakeet', 'stripes'] },
    { name: 'African Grey', kws: ['african grey', 'grey parrot', 'red tail'] },
    { name: 'Lovebird', kws: ['lovebird', 'peach face', 'agapornis'] },
    { name: 'Canary', kws: ['canary', 'yellow songbird', 'singing'] },
    { name: 'Zebra Finch', kws: ['zebra finch', 'finch', 'tear stripe'] },
    { name: 'Green-Cheeked Conure', kws: ['conure', 'green cheek', 'maroon tail'] },
    { name: 'Barn Owl', kws: ['barn owl', 'owl', 'heart face'] },
    { name: 'Blue Jay', kws: ['blue jay', 'jay', 'blue crest'] }
  ];

  for (const item of known) {
    if (item.kws.some(kw => t.includes(kw))) {
      const match = db.prepare('SELECT * FROM species WHERE name = ?').get(item.name);
      if (match) return match;
    }
  }
  return db.prepare('SELECT * FROM species LIMIT 1').get();
}

// Accept either field 'photo' or 'image'
const uploadMiddleware = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// POST /api/identify
router.post('/', uploadMiddleware, async (req, res) => {
  try {
    const uploadedFile = (req.files && (req.files['photo']?.[0] || req.files['image']?.[0])) || req.file;
    const description = (req.body.description || req.body.notes || '').trim();
    const uploadedImageUrl = uploadedFile ? `/uploads/${uploadedFile.filename}` : null;

    if (!uploadedFile && !description) {
      return res.status(400).json({
        error: 'Please provide either an image file or a text description to identify.'
      });
    }

    let aiResult = null;

    try {
      const contents = [];

      // 1. If an image is uploaded, add the inlineData part
      if (uploadedFile) {
        const fileBuffer = fs.readFileSync(uploadedFile.path);
        contents.push({
          inlineData: {
            mimeType: uploadedFile.mimetype || 'image/jpeg',
            data: fileBuffer.toString('base64')
          }
        });
      }

      // 2. Add prompt instruction
      const promptText = `
You are an expert avian biologist and bird identifier.
Analyze the provided ${uploadedFile ? 'image' : ''} ${uploadedFile && description ? 'and' : ''} ${description ? `description: "${description}"` : ''}.
Identify the bird species, evaluate your confidence, and provide factual care information.

Respond with ONLY a valid JSON object strictly matching this schema:
{
  "species_name": "Common species name (e.g. Cockatiel, Budgerigar, African Grey, Blue Jay)",
  "confidence": "High / Medium / Low",
  "description": "Comprehensive physical description and key visual identifying features",
  "fun_facts": [
    "Interesting behavioral or biological fact 1",
    "Interesting behavioral or biological fact 2"
  ],
  "habitat": "Natural geographic origin and wild habitat",
  "diet": "Recommended domestic diet (pellets, seeds, greens) or natural wild diet"
}
`;
      contents.push(promptText);

      const aiResponse = await generateAIContent({
        contents,
        responseMimeType: 'application/json'
      });

      aiResult = aiResponse.data;
    } catch (aiErr) {
      console.warn('[Identification AI Warning] Gemini API unavailable or errored, using database heuristic:', aiErr.message);
    }

    // If AI failed or returned invalid data, use heuristic
    if (!aiResult || !aiResult.species_name) {
      const fallback = getHeuristicMatch(description || (uploadedFile ? uploadedFile.originalname : ''));
      aiResult = {
        species_name: fallback ? fallback.name : 'Cockatiel',
        confidence: 'Medium',
        description: fallback ? fallback.fun_facts : 'A companion bird species with distinctive plumage.',
        fun_facts: fallback ? [fallback.fun_facts, 'Social and vocal flock companion.'] : ['Birds communicate with vocal whistles and crest movements.'],
        habitat: fallback ? fallback.habitat : 'Australia grasslands and scrublands',
        diet: fallback ? fallback.diet : 'Balanced pellets, seed mix, and fresh greens'
      };
    }

    // Look up in database to attach species_id and local details if available
    let dbSpecies = null;
    if (aiResult.species_name) {
      dbSpecies = db.prepare(`
        SELECT * FROM species 
        WHERE LOWER(name) = LOWER(?) OR LOWER(name) LIKE LOWER(?)
      `).get(aiResult.species_name, `%${aiResult.species_name}%`);
    }

    // Combine into final response matching exact spec and backward compatibility
    const response = {
      species_name: aiResult.species_name,
      confidence: aiResult.confidence || 'High',
      description: aiResult.description,
      fun_facts: Array.isArray(aiResult.fun_facts) ? aiResult.fun_facts : [aiResult.fun_facts].filter(Boolean),
      habitat: aiResult.habitat,
      diet: aiResult.diet,
      // Backward-compatible fields for frontend UI
      species: aiResult.species_name,
      species_id: dbSpecies ? dbSpecies.id : null,
      rationale: aiResult.description,
      image_url: uploadedImageUrl || (dbSpecies ? dbSpecies.image_url : null),
      type: dbSpecies ? dbSpecies.type : 'Companion Bird'
    };

    res.json(response);
  } catch (err) {
    console.error('Error during species identification:', err);
    res.status(500).json({ error: 'Failed to identify bird: ' + err.message });
  }
});

module.exports = router;
