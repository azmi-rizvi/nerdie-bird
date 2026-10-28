const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../database');
const { generateAIContent, sendGeminiError } = require('../utils/gemini');

const publicSpeciesDir = path.join(__dirname, '..', '..', 'nerdie-frontend', 'public', 'species');
const backendSpeciesDir = path.join(__dirname, '..', 'uploads', 'species');

if (!fs.existsSync(publicSpeciesDir)) fs.mkdirSync(publicSpeciesDir, { recursive: true });
if (!fs.existsSync(backendSpeciesDir)) fs.mkdirSync(backendSpeciesDir, { recursive: true });

// Curated verified local fallback bird images by category
const TYPE_LOCAL_FALLBACK = {
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

/**
 * Automatically downloads and caches an authentic canonical photograph of the discovered bird species
 */
async function fetchAndSaveBirdPhoto(speciesName, geminiImageUrl, categoryType) {
  try {
    const slug = speciesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `${slug}.jpg`;
    const pubDest = path.join(publicSpeciesDir, filename);
    const bkdDest = path.join(backendSpeciesDir, filename);

    // If file already exists locally, use it immediately
    if (fs.existsSync(pubDest) && fs.statSync(pubDest).size > 5000) {
      if (!fs.existsSync(bkdDest)) fs.copyFileSync(pubDest, bkdDest);
      return `/species/${filename}`;
    }

    // 1. First priority: Fetch authentic canonical photograph from Wikipedia pageimages API
    const endpoint = new URL('https://en.wikipedia.org/w/api.php');
    endpoint.searchParams.set('action', 'query');
    endpoint.searchParams.set('titles', speciesName);
    endpoint.searchParams.set('prop', 'pageimages');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('pithumbsize', '900');

    let downloadUrl = null;
    try {
      const res = await fetch(endpoint.toString(), {
        headers: { 'User-Agent': 'FeatherCareBot/1.0 (contact@feathercare.local)' }
      });
      const data = await res.json();
      const page = Object.values(data.query?.pages || {})[0];
      downloadUrl = page?.thumbnail?.source || null;
    } catch (wikiErr) {
      console.warn(`Wiki photo lookup for "${speciesName}":`, wikiErr.message);
    }

    // 2. Second priority: If Gemini provided a direct http image URL
    if (!downloadUrl && geminiImageUrl && typeof geminiImageUrl === 'string' && geminiImageUrl.startsWith('http')) {
      downloadUrl = geminiImageUrl;
    }

    // 3. Download and save locally
    if (downloadUrl) {
      const imgRes = await fetch(downloadUrl, {
        headers: { 'User-Agent': 'FeatherCareBot/1.0 (contact@feathercare.local)' }
      });
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        if (buffer.length > 5000) {
          fs.writeFileSync(pubDest, buffer);
          fs.writeFileSync(bkdDest, buffer);
          console.log(`[Auto-Cached Photo] Downloaded verified photo for "${speciesName}" -> /species/${filename}`);
          return `/species/${filename}`;
        }
      }
    }
  } catch (err) {
    console.warn(`Could not save local photo for "${speciesName}":`, err.message);
  }

  // Safe fallback to guaranteed authentic local bird photo
  return TYPE_LOCAL_FALLBACK[categoryType] || TYPE_LOCAL_FALLBACK['Default'];
}

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

Pick an authentic, recognized real bird species (e.g., from Parrots, Finches, Raptors, Softbills, Waterfowl, Wild Birds, Canaries, or Pigeons & Doves).
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
  "image_url": "Direct, authentic public photo URL of this exact bird species to show to the user (e.g. from Wikimedia Commons or Wikipedia). Return ONLY a direct photo link of this bird species, never random scenery, drones, or people."
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
      return res.json(existingCheck);
    }

    const categoryType = String(birdData.type || 'Companion Bird').trim();

    // Fetch and cache the authentic canonical bird photo
    const localImageUrl = await fetchAndSaveBirdPhoto(speciesName, birdData.image_url, categoryType);

    // Format fun_facts string for database
    let funFactsStr = '';
    if (Array.isArray(birdData.fun_facts)) {
      funFactsStr = birdData.fun_facts.join(' ');
    } else if (typeof birdData.fun_facts === 'string') {
      funFactsStr = birdData.fun_facts;
    } else {
      funFactsStr = 'Intriguing and beautiful bird species.';
    }

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
      localImageUrl
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
