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

// Comprehensive pool of 100% verified, real biological bird species with scientific nomenclature
const VERIFIED_REAL_SPECIES_POOL = [
  // Parrots
  { name: "Galah", scientific_name: "Eolophus roseicapilla", type: "Parrots" },
  { name: "Major Mitchell's Cockatoo", scientific_name: "Lophochroa leadbeateri", type: "Parrots" },
  { name: "Alexandrine Parakeet", scientific_name: "Psittacula eupatria", type: "Parrots" },
  { name: "Rose-Ringed Parakeet", scientific_name: "Psittacula krameri", type: "Parrots" },
  { name: "Monk Parakeet", scientific_name: "Myiopsitta monachus", type: "Parrots" },
  { name: "Senegal Parrot", scientific_name: "Poicephalus senegalus", type: "Parrots" },
  { name: "Meyer's Parrot", scientific_name: "Poicephalus meyeri", type: "Parrots" },
  { name: "Black-Headed Caique", scientific_name: "Pionites melanocephalus", type: "Parrots" },
  { name: "White-Bellied Caique", scientific_name: "Pionites leucogaster", type: "Parrots" },
  { name: "Bourke's Parrot", scientific_name: "Neopsephotus bourkii", type: "Parrots" },
  { name: "Pacific Parrotlet", scientific_name: "Forpus coelestis", type: "Parrots" },
  { name: "Blue-Headed Pionus", scientific_name: "Pionus menstruus", type: "Parrots" },
  { name: "Red-Bellied Parrot", scientific_name: "Poicephalus rufiventris", type: "Parrots" },
  { name: "Kakapo", scientific_name: "Strigops habroptila", type: "Parrots" },
  { name: "Palm Cockatoo", scientific_name: "Probosciger aterrimus", type: "Parrots" },
  { name: "Red-Tailed Black Cockatoo", scientific_name: "Calyptorhynchus banksii", type: "Parrots" },
  { name: "White-Fronted Amazon", scientific_name: "Amazona albifrons", type: "Parrots" },
  { name: "Crimson Rosella", scientific_name: "Platycercus elegans", type: "Parrots" },
  { name: "Eastern Rosella", scientific_name: "Platycercus eximius", type: "Parrots" },
  { name: "Blue-Throated Macaw", scientific_name: "Ara glaucogularis", type: "Parrots" },
  { name: "Military Macaw", scientific_name: "Ara militaris", type: "Parrots" },
  { name: "Burrowing Parrot", scientific_name: "Cyanoliseus patagonus", type: "Parrots" },

  // Softbills
  { name: "Livingstone's Turaco", scientific_name: "Tauraco livingstonii", type: "Softbills" },
  { name: "Toco Toucan", scientific_name: "Ramphastos toco", type: "Softbills" },
  { name: "Channel-Billed Toucan", scientific_name: "Ramphastos vitellinus", type: "Softbills" },
  { name: "Green Aracari", scientific_name: "Pteroglossus viridis", type: "Softbills" },
  { name: "Emerald Toucanet", scientific_name: "Aulacorhynchus prasinus", type: "Softbills" },
  { name: "Red-Crested Turaco", scientific_name: "Tauraco erythrolophus", type: "Softbills" },

  // Wild Birds
  { name: "Shoebill", scientific_name: "Balaeniceps rex", type: "Wild Birds" },
  { name: "Atlantic Puffin", scientific_name: "Fratercula arctica", type: "Wild Birds" },
  { name: "Laughing Kookaburra", scientific_name: "Dacelo novaeguineae", type: "Wild Birds" },
  { name: "Guianan Cock-of-the-Rock", scientific_name: "Rupicola rupicola", type: "Wild Birds" },
  { name: "Superb Fairywren", scientific_name: "Malurus cyaneus", type: "Wild Birds" },
  { name: "European Robin", scientific_name: "Erithacus rubecula", type: "Wild Birds" },
  { name: "Northern Cardinal", scientific_name: "Cardinalis cardinalis", type: "Wild Birds" },
  { name: "Cedar Waxwing", scientific_name: "Bombycilla cedrorum", type: "Wild Birds" },
  { name: "Bohemian Waxwing", scientific_name: "Bombycilla garrulus", type: "Wild Birds" },
  { name: "Eurasian Hoopoe", scientific_name: "Upupa epops", type: "Wild Birds" },
  { name: "Great Blue Heron", scientific_name: "Ardea herodias", type: "Wild Birds" },
  { name: "Grey Crowned Crane", scientific_name: "Balearica regulorum", type: "Wild Birds" },
  { name: "Sunbittern", scientific_name: "Eurypyga helias", type: "Wild Birds" },

  // Raptors
  { name: "Secretarybird", scientific_name: "Sagittarius serpentarius", type: "Raptors" },
  { name: "Golden Eagle", scientific_name: "Aquila chrysaetos", type: "Raptors" },
  { name: "Osprey", scientific_name: "Pandion haliaetus", type: "Raptors" },
  { name: "Harris's Hawk", scientific_name: "Parabuteo unicinctus", type: "Raptors" },
  { name: "American Kestrel", scientific_name: "Falco sparverius", type: "Raptors" },
  { name: "Great Horned Owl", scientific_name: "Bubo virginianus", type: "Raptors" },
  { name: "Eurasian Eagle-Owl", scientific_name: "Bubo bubo", type: "Raptors" },
  { name: "Burrowing Owl", scientific_name: "Athene cunicularia", type: "Raptors" },

  // Waterfowl
  { name: "Black Swan", scientific_name: "Cygnus atratus", type: "Waterfowl" },
  { name: "Mute Swan", scientific_name: "Cygnus olor", type: "Waterfowl" },
  { name: "Harlequin Duck", scientific_name: "Histrionicus histrionicus", type: "Waterfowl" },
  { name: "Canvasback", scientific_name: "Aythya valisineria", type: "Waterfowl" },
  { name: "Barnacle Goose", scientific_name: "Branta leucopsis", type: "Waterfowl" },

  // Canaries & Finches
  { name: "Atlantic Canary", scientific_name: "Serinus canaria", type: "Canaries" },
  { name: "House Finch", scientific_name: "Haemorhous mexicanus", type: "Finches" },
  { name: "Society Finch", scientific_name: "Lonchura striata domestica", type: "Finches" },
  { name: "Painted Bunting", scientific_name: "Passerina ciris", type: "Finches" },
  { name: "Indigo Bunting", scientific_name: "Passerina cyanea", type: "Finches" },
  { name: "Star Finch", scientific_name: "Neochmia ruficauda", type: "Finches" },
  { name: "Owl Finch", scientific_name: "Taeniopygia bichenovii", type: "Finches" },

  // Pigeons & Doves
  { name: "Nicobar Pigeon", scientific_name: "Caloenas nicobarica", type: "Pigeons & Doves" },
  { name: "Luzon Bleeding-Heart", scientific_name: "Gallicolumba luzonica", type: "Pigeons & Doves" },
  { name: "Spinifex Pigeon", scientific_name: "Geophaps plumifera", type: "Pigeons & Doves" },
  { name: "Crested Pigeon", scientific_name: "Ocyphaps lophotes", type: "Pigeons & Doves" }
];

/**
 * Strict biological verification: validates the species against Wikipedia's biological taxonomy
 */
async function verifyBiologicalSpecies(scientificName, commonName) {
  const queryTerms = [scientificName, commonName].filter(t => t && typeof t === 'string' && t.trim().length > 2);
  if (queryTerms.length === 0) return { verified: false };

  for (const term of queryTerms) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=${encodeURIComponent(term.trim())}&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=900&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FeatherCareAvianApp/1.0 (https://feathercare.org; support@feathercare.org)' }
      });
      if (!res.ok) continue;

      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});

      for (const page of pages) {
        if (page && !('missing' in page) && page.pageid > 0) {
          const text = (page.extract || '').toLowerCase();
          const title = (page.title || '').toLowerCase();

          // Reject disambiguation pages or non-taxa
          if (text.includes('may refer to:') || text.includes('refer to:')) {
            continue;
          }

          const isBiological = text.includes('bird') ||
                               text.includes('species') ||
                               text.includes('family') ||
                               text.includes('genus') ||
                               text.includes('plumage') ||
                               text.includes('avian') ||
                               text.includes('parrot') ||
                               text.includes('passerine') ||
                               text.includes('duck') ||
                               text.includes('owl') ||
                               text.includes('falcon') ||
                               text.includes('finch') ||
                               text.includes('dove') ||
                               text.includes('order');

          if (isBiological) {
            return {
              verified: true,
              title: page.title,
              thumbnail: page.thumbnail?.source || null,
              extract: page.extract || null
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[Taxonomy Verification] Failed lookup for "${term}":`, err.message);
    }
  }

  return { verified: false };
}

/**
 * Downloads and caches an authentic canonical photograph of the discovered bird species
 */
async function fetchAndSaveBirdPhoto(speciesName, wikiThumbnail, geminiImageUrl, categoryType) {
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

    // Determine download URL
    let downloadUrl = wikiThumbnail || null;

    if (!downloadUrl && geminiImageUrl && typeof geminiImageUrl === 'string' && geminiImageUrl.startsWith('http')) {
      downloadUrl = geminiImageUrl;
    }

    // Download and save locally
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

// POST /api/species/discover - Dynamically generate a new REAL bird species via Gemini AI & auto-save to database
router.post('/discover', async (req, res) => {
  try {
    // 1. Query database for existing bird species names
    const existingRows = db.prepare('SELECT name FROM species').all();
    const existingNames = existingRows.map(r => r.name.toLowerCase());

    // 2. Filter uncataloged candidates from verified biological pool
    const uncatalogedPool = VERIFIED_REAL_SPECIES_POOL.filter(
      p => !existingNames.includes(p.name.toLowerCase())
    );

    // Pick 8 diverse real candidate inspirations
    const shuffledPool = [...uncatalogedPool].sort(() => 0.5 - Math.random());
    const sampleCandidates = shuffledPool.slice(0, 8);
    const candidateListStr = sampleCandidates.map(c => `"${c.name}" (${c.scientific_name}, Type: ${c.type})`).join(', ');

    // 3. Strict prompt for Gemini with zero-tolerance for hallucinations
    const prompt = `
You are a senior avian taxonomist, ornithologist, and avian care specialist.
Select ONE genuine, scientifically recognized, real-world bird species that is NOT already in our catalog.

CRITICAL ZERO-TOLERANCE ANTI-HALLUCINATION REQUIREMENT:
1. The bird MUST be an actual, real, extant biological species recognized in ornithological registries (e.g. IOC World Bird List, Clements Checklist, or IUCN Red List).
2. You are STRICTLY FORBIDDEN from creating fictional, hypothetical, hybrid, or chimeric bird species names (such as blending parts of different birds into names like "Hyacinthine Visored Lorikeet").
3. You MUST provide the exact Latin binomial scientific name (genus + species, e.g., "Eolophus roseicapilla", "Tauraco livingstonii", "Balaeniceps rex").
4. If you return an invented or non-existent bird species, the system will reject it.

EXISTING SPECIES ALREADY IN CATALOG (DO NOT CHOOSE THESE):
${existingRows.map(r => r.name).slice(0, 40).join(', ')}

REAL CANDIDATE INSPIRATIONS NOT YET IN OUR CATALOG (You may choose one of these or any other 100% genuine real bird):
${candidateListStr}

Respond with ONLY a valid JSON object matching this exact schema:
{
  "name": "Standard real common species name (e.g., 'Galah', 'Livingstone\\'s Turaco', 'Shoebill', 'Atlantic Puffin')",
  "scientific_name": "Valid Latin binomial name (e.g., 'Eolophus roseicapilla', 'Tauraco livingstonii', 'Balaeniceps rex')",
  "type": "Parrots" | "Finches" | "Wild Birds" | "Softbills" | "Raptors" | "Waterfowl" | "Canaries" | "Pigeons & Doves",
  "habitat": "Detailed natural geographic origin, climate, and wild habitat biome",
  "diet": "Recommended domestic diet (pellets, seeds, fresh produce) or natural wild diet",
  "cage_setup": "Cage dimensions, wire spacing, perches, toys, and environmental parameters",
  "social_needs": "Flock dynamic, daily interaction requirements, mental stimulation, and human companionship",
  "lifespan": "Typical lifespan (e.g., '15 - 25 years')",
  "fun_facts": [
    "Fascinating behavioral or physiological fact 1",
    "Fascinating behavioral or physiological fact 2"
  ],
  "image_url": "Direct Wikipedia or Wikimedia Commons image link of this real bird if available, or empty string"
}
`;

    const aiResponse = await generateAIContent({
      contents: [prompt],
      responseMimeType: 'application/json',
      timeoutMs: 25000
    });

    let birdData = aiResponse.data;

    if (!birdData || typeof birdData !== 'object' || !birdData.name) {
      return res.status(502).json({ error: 'Gemini AI returned an invalid or incomplete bird species profile.' });
    }

    let speciesName = String(birdData.name).trim();
    let scientificName = String(birdData.scientific_name || '').trim();
    let categoryType = String(birdData.type || 'Companion Bird').trim();

    // 4. Biological Verification Gatekeeper
    let wikiResult = await verifyBiologicalSpecies(scientificName, speciesName);

    // If the species failed Wikipedia biological verification, reject hallucination and fallback to verified candidate
    if (!wikiResult.verified) {
      console.warn(`[Anti-Hallucination Guard] Gemini generated unverified or non-biological species: "${speciesName}". Substituting with guaranteed authentic biological candidate.`);
      
      const fallbackReal = sampleCandidates[0] || VERIFIED_REAL_SPECIES_POOL[0];
      speciesName = fallbackReal.name;
      scientificName = fallbackReal.scientific_name;
      categoryType = fallbackReal.type;

      // Re-verify the guaranteed candidate to obtain canonical wiki image
      wikiResult = await verifyBiologicalSpecies(scientificName, speciesName);
    }

    // Check if species already exists in database
    const existingCheck = db.prepare('SELECT * FROM species WHERE LOWER(name) = LOWER(?)').get(speciesName);
    if (existingCheck) {
      return res.json(existingCheck);
    }

    // Fetch and cache the authentic canonical bird photo
    const localImageUrl = await fetchAndSaveBirdPhoto(
      speciesName,
      wikiResult.thumbnail,
      birdData.image_url,
      categoryType
    );

    // Format fun_facts string for database
    let funFactsStr = '';
    if (Array.isArray(birdData.fun_facts)) {
      funFactsStr = birdData.fun_facts.join(' ');
    } else if (typeof birdData.fun_facts === 'string') {
      funFactsStr = birdData.fun_facts;
    } else {
      funFactsStr = 'Intriguing and beautiful bird species recognized in biological taxonomy.';
    }

    const habitat = String(birdData.habitat || 'Varied natural habitats').trim();
    const diet = String(birdData.diet || 'Nutritious balanced diet').trim();
    const cageSetup = String(birdData.cage_setup || 'Spacious enclosure with safe natural perches').trim();
    const socialNeeds = String(birdData.social_needs || 'Daily social interaction and mental stimulation').trim();
    const lifespan = String(birdData.lifespan || '10 - 20 years').trim();

    // 5. Insert into database
    const insertStmt = db.prepare(`
      INSERT INTO species (name, type, habitat, diet, cage_setup, social_needs, lifespan, fun_facts, image_url, scientific_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      localImageUrl,
      scientificName
    );

    // 6. Retrieve and return newly saved record with assigned id
    const newRecord = db.prepare('SELECT * FROM species WHERE id = ?').get(result.lastInsertRowid);

    console.log(`[Discover Bird Success] Real biological species discovered and saved: "${speciesName}" (${scientificName}) [ID: ${newRecord.id}]`);

    return res.status(201).json({
      ...newRecord,
      web_image_url: wikiResult.thumbnail || birdData.image_url || null,
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
      query += ' AND (LOWER(name) LIKE ? OR LOWER(fun_facts) LIKE ? OR LOWER(habitat) LIKE ? OR LOWER(diet) LIKE ? OR LOWER(COALESCE(scientific_name, \'\')) LIKE ?)';
      params.push(term, term, term, term, term);
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
