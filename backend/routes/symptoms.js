const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateAIContent } = require('../utils/gemini');

// GET /api/symptoms - Retrieve all pre-populated symptoms from database
router.get('/', (req, res) => {
  try {
    const symptoms = db.prepare('SELECT * FROM symptoms ORDER BY symptom ASC').all();
    res.json(symptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// POST /api/symptoms - Check symptoms using Gemini AI + database knowledge
router.post('/', async (req, res) => {
  try {
    let { symptoms, symptom, species, birdName } = req.body;

    // Normalize symptoms into an array of strings
    let selectedSymptoms = [];
    if (Array.isArray(symptoms)) {
      selectedSymptoms = symptoms.filter(s => typeof s === 'string' && s.trim().length > 0);
    } else if (typeof symptoms === 'string' && symptoms.trim().length > 0) {
      selectedSymptoms = [symptoms.trim()];
    } else if (typeof symptom === 'string' && symptom.trim().length > 0) {
      selectedSymptoms = [symptom.trim()];
    }

    if (selectedSymptoms.length === 0) {
      return res.status(400).json({
        error: 'Please select or provide at least one symptom to evaluate.'
      });
    }

    const birdSpecies = species || (birdName ? `Bird named ${birdName}` : 'Companion Bird');

    // 1. Check local database for immediate baseline reference
    const matchedRecords = [];
    for (const item of selectedSymptoms) {
      const match = db.prepare(`
        SELECT * FROM symptoms 
        WHERE LOWER(symptom) = LOWER(?) OR LOWER(symptom) LIKE LOWER(?)
      `).get(item, `%${item}%`);
      if (match && !matchedRecords.some(r => r.id === match.id)) {
        matchedRecords.push(match);
      }
    }
    const dbEmergency = matchedRecords.some(r => r.vet_emergency === 1);

    // 2. Call Gemini AI for specialized species-aware clinical assessment
    let aiData = null;

    try {
      const promptText = `
You are an expert avian veterinarian consulting on companion bird health.
A user has reported symptoms for their bird:
- Species/Bird: ${birdSpecies}
- Observed Symptoms: ${selectedSymptoms.join(', ')}

Analyze these symptoms specifically in the context of avian physiology and this bird species.
Determine if any of these symptoms represent a critical life-threatening emergency (such as acute respiratory distress, severe bleeding, egg binding, extreme hypothermia, or rapid hypoglycemia).
Provide actionable home first-aid care tips and possible causes.

Respond with ONLY a valid JSON object matching this schema:
{
  "possible_causes": [
    "Cause 1 with clinical explanation",
    "Cause 2 with clinical explanation"
  ],
  "care_tips": [
    "Immediate supportive care step 1",
    "Immediate supportive care step 2"
  ],
  "vet_emergency_flag": true,
  "disclaimer": "Disclaimer: This tool provides general guidance only and is not a replacement for professional veterinary medical advice."
}
`;

      const aiResponse = await generateAIContent({
        contents: promptText,
        responseMimeType: 'application/json'
      });

      aiData = aiResponse.data;
    } catch (aiErr) {
      console.warn('[Symptoms AI Warning] Gemini API unavailable or errored, falling back to local database:', aiErr.message);
    }

    // If AI succeeded, use its comprehensive assessment; otherwise construct from database
    let possibleCausesArr = [];
    let careTipsArr = [];
    let isEmergency = dbEmergency;
    let disclaimerText = "Disclaimer: This tool provides general guidance only and is not a replacement for professional veterinary medical advice.";

    if (aiData && Array.isArray(aiData.possible_causes)) {
      possibleCausesArr = aiData.possible_causes;
      careTipsArr = Array.isArray(aiData.care_tips) ? aiData.care_tips : [aiData.care_tips].filter(Boolean);
      isEmergency = Boolean(aiData.vet_emergency_flag || dbEmergency);
      if (aiData.disclaimer) disclaimerText = aiData.disclaimer;
    } else {
      // Database fallback
      possibleCausesArr = matchedRecords.length > 0
        ? matchedRecords.map(r => `${r.symptom}: ${r.possible_causes}`)
        : [`Non-specific symptoms reported (${selectedSymptoms.join(', ')}). May stem from nutritional imbalance, infection, or environmental stress.`];

      careTipsArr = matchedRecords.length > 0
        ? matchedRecords.map(r => `${r.symptom}: ${r.care_tips}`)
        : ['Keep the bird in a quiet, warm (82-85°F) draft-free room. Offer fresh water and easily digestible food. Monitor closely.'];
    }

    // Consolidated human-readable summary
    const summaryText = isEmergency
      ? 'CRITICAL WARNING: One or more symptoms indicate a potential avian emergency. Birds conceal illness until it is advanced; please contact an avian veterinarian or animal emergency clinic immediately.'
      : 'ADVISORY: These symptoms may be manageable with close observation, environmental adjustments, and proper hydration. If condition does not improve within 24 hours, seek veterinary guidance.';

    // Construct response satisfying both prompt schema and backward compatibility
    res.json({
      possible_causes: possibleCausesArr,
      care_tips: careTipsArr,
      vet_emergency_flag: isEmergency,
      disclaimer: disclaimerText,
      // Backward-compatible fields
      bird_name: birdName || birdSpecies,
      selected_symptoms: selectedSymptoms,
      vet_emergency: isEmergency,
      recommendation_summary: summaryText,
      details: matchedRecords
    });
  } catch (err) {
    console.error('Error in symptom checker:', err);
    res.status(500).json({ error: 'Failed to process symptom check: ' + err.message });
  }
});

module.exports = router;
