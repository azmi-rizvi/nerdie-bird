const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateAIContent, sendGeminiError } = require('../utils/gemini');

// Curated high-resolution fallback Unsplash images by bird category
const TYPE_FALLBACK_IMAGES = {
  'Parrots': 'https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=800&q=80',
  'Finches': 'https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=800&q=80',
  'Canaries': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
  'Raptors': 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=800&q=80',
  'Wild Birds': 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  'Waterfowl': 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=800&q=80',
  'Softbills': 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80',
  'Pigeons & Doves': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
  'Default': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80'
};

// GET /api/species/types - return list of all distinct species types
router.get('/types', (req, res) => {
  try {
    const types = db.prepare('SELECT DISTINCT type FROM species ORDER BY type ASC').all();
    res.json(['All', ...types.map(t => t.type)]);
  } catch (err) {
    console.error('Error fetching species types:', err);
    res.status(500).json({ error: 'Failed to fetch species types' });
  }
});

// POST /api/species/discover - Dynamically generate a new bird species via Gemini AI & auto-save to database
router.post('/discover', async (req, res) => {
  try {
    // 1. Query database for existing bird species names
    const existingRows = db.prepare('SELECT name FROM species').all();
    const existingNames = existingRows.map(r => r.name);

    // 2. Formulate prompt for Gemini
    const prompt = `
You are an expert avian taxonomist, ornithologist, and avian care specialist.
Generate a real, scientifically recognized bird species that is NOT already in our database catalog.

CRITICAL EXCLUSIONS:
Do NOT choose any of the following species (they are already in our database):
${existingNames.slice(0, 50).join(', ')}

Pick an intriguing, authentic, and distinctive real bird species (e.g., from Parrots, Finches, Raptors, Softbills, Waterfowl, Wild Birds, Canaries, or Pigeons & Doves).
Provide accurate, comprehensive care and biological details.

Respond with ONLY a valid JSON object matching this exact schema:
{
  "name": "Common species name (e.g., 'Rosy-Faced Lovebird', 'Major Mitchell\\'s Cockatoo', 'Eurasian Blue Tit', 'Northern Cardinal')",
  "type": "Parrots | Finches | Wild Birds | Softbills | Raptors | Waterfowl | Canaries | Pigeons & Doves",
  "habitat": "Detailed natural geographic origin, climate, and wild habitat biome",
  "diet": "Recommended domestic diet (pellets, seeds, fresh produce) or natural wild diet",
  "cage_setup": "Cage dimensions, wire spacing, perches, toys, and environmental parameters",
  "social_needs": "Flock dynamic, daily interaction requirements, mental stimulation, and human companionship",
  "lifespan": "Typical lifespan (e.g., '15 - 25 years')",
  "fun_facts": [
    "Fascinating behavioral or physiological fact 1",
    "Fascinating behavioral or physiological fact 2"
  ],
  "image_url": "A high-quality, valid Unsplash image URL matching this species (e.g., https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80)"
}
`;

    const aiResponse = await generateAIContent({
      contents: [prompt],
      responseMimeType: 'application/json',
      timeoutMs: 25000
    });

    const birdData = aiResponse.data;

    if (!birdData || typeof birdData !== 'object' || !birdData.name) {
      return res.status(502).json({ error: 'Gemini AI returned an invalid or incomplete bird species profile.' });
    }

    const speciesName = String(birdData.name).trim();

    // Check if name already exists in database
    const existingCheck = db.prepare('SELECT * FROM species WHERE LOWER(name) = LOWER(?)').get(speciesName);
    if (existingCheck) {
      // Return existing record if already found
      return res.json(existingCheck);
    }

    // Resolve image URL
    let imageUrl = birdData.image_url;
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      const birdType = birdData.type || 'Default';
      imageUrl = TYPE_FALLBACK_IMAGES[birdType] || TYPE_FALLBACK_IMAGES['Default'];
    }

    // Format fun_facts string for database
    let funFactsStr = '';
    if (Array.isArray(birdData.fun_facts)) {
      funFactsStr = birdData.fun_facts.join(' ');
    } else if (typeof birdData.fun_facts === 'string') {
      funFactsStr = birdData.fun_facts;
    } else {
      funFactsStr = 'Intriguing and beautiful bird species.';
    }

    const categoryType = String(birdData.type || 'Companion Bird').trim();
    const habitat = String(birdData.habitat || 'Varied natural habitats').trim();
    const diet = String(birdData.diet || 'Nutritious balanced diet').trim();
    const cageSetup = String(birdData.cage_setup || 'Spacious enclosure with safe natural perches').trim();
    const socialNeeds = String(birdData.social_needs || 'Daily social interaction and mental stimulation').trim();
    const lifespan = String(birdData.lifespan || '10 - 20 years').trim();

    // 3. Insert into database
    const insertStmt = db.prepare(`
      INSERT INTO species (name, type, habitat, diet, cage_setup, social_needs, lifespan, fun_facts, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      speciesName,
      categoryType,
      habitat,
      diet,
      cageSetup,
      socialNeeds,
      lifespan,
      funFactsStr,
      imageUrl
    );

    // 4. Retrieve and return newly saved record with assigned id
    const newRecord = db.prepare('SELECT * FROM species WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      ...newRecord,
      fun_facts_array: Array.isArray(birdData.fun_facts) ? birdData.fun_facts : [funFactsStr],
      ai_discovered: true,
      ai_model: aiResponse.modelUsed
    });
  } catch (err) {
    console.error('Error discovering new bird species:', err);
    return sendGeminiError(res, err);
  }
});

// GET /api/species - Retrieve all species with optional ?search= and ?type=
router.get('/', (req, res) => {
  try {
    const { search, type } = req.query;
    let query = 'SELECT * FROM species WHERE 1=1';
    const params = [];

    if (type && type !== 'All') {
      if (type.toLowerCase() === 'pet') {
        query += " AND type != 'Wild Birds'";
      } else if (type.toLowerCase() === 'wild') {
        query += " AND type = 'Wild Birds'";
      } else {
        query += ' AND LOWER(type) = LOWER(?)';
        params.push(type);
      }
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(name) LIKE ? OR LOWER(fun_facts) LIKE ? OR LOWER(habitat) LIKE ? OR LOWER(diet) LIKE ?)';
      params.push(term, term, term, term);
    }

    query += ' ORDER BY id ASC';
    const species = db.prepare(query).all(...params);
    res.json(species);
  } catch (err) {
    console.error('Error fetching species:', err);
    res.status(500).json({ error: 'Failed to fetch species' });
  }
});

// GET /api/species/:id - Retrieve detailed profile for a specific bird species
router.get('/:id', (req, res) => {
  try {
    const species = db.prepare('SELECT * FROM species WHERE id = ?').get(req.params.id);
    if (!species) {
      return res.status(404).json({ error: 'Species not found' });
    }
    res.json(species);
  } catch (err) {
    console.error('Error fetching species details:', err);
    res.status(500).json({ error: 'Failed to fetch species details' });
  }
});

module.exports = router;
