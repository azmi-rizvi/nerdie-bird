const express = require('express');
const db = require('../database');
const { generateAIContent, sendGeminiError } = require('../utils/gemini');

const router = express.Router();
const DISCLAIMER = 'This tool provides general educational guidance only and is NOT a substitute for professional veterinary diagnosis or emergency treatment. Always consult an avian veterinarian for health concerns.';

// GET /api/symptoms - Retrieve symptom catalog from database
router.get('/', (req, res) => {
  try {
    const symptoms = db.prepare('SELECT * FROM symptoms ORDER BY symptom ASC').all();
    return res.json(symptoms);
  } catch (error) {
    console.error('Error fetching symptom catalog:', error);
    return res.status(500).json({ error: 'Failed to fetch the symptom catalog.' });
  }
});

function isValidAIResponse(data) {
  return data && typeof data === 'object' &&
    Array.isArray(data.possible_causes) && data.possible_causes.length > 0 &&
    Array.isArray(data.care_tips) && data.care_tips.length > 0 &&
    typeof data.vet_emergency_flag === 'boolean';
}

// POST /api/symptoms - Full AI symptom evaluation with intelligent fallback
router.post('/', async (req, res) => {
  const { symptoms, symptom, species, birdName } = req.body || {};
  const rawSymptoms = Array.isArray(symptoms)
    ? symptoms
    : [typeof symptoms === 'string' ? symptoms : symptom];

  const selectedSymptoms = [...new Set(rawSymptoms
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean))];

  if (!selectedSymptoms.length) {
    return res.status(400).json({ error: 'Please select or provide at least one symptom to evaluate.' });
  }
  if (selectedSymptoms.length > 20 || selectedSymptoms.some(item => item.length > 300)) {
    return res.status(400).json({ error: 'Please provide up to 20 symptoms, each under 300 characters.' });
  }

  const birdSpecies = typeof species === 'string' && species.trim()
    ? species.trim().slice(0, 100)
    : 'Companion bird';
  const safeBirdName = typeof birdName === 'string' ? birdName.trim().slice(0, 100) : '';

  const prompt = `You are an expert avian health and triage education assistant.
A bird owner reports the following observed symptoms:
- Bird Species: ${JSON.stringify(birdSpecies)}
- Bird Name: ${JSON.stringify(safeBirdName || 'not provided')}
- Symptoms: ${JSON.stringify(selectedSymptoms)}

Provide an avian-specific clinical analysis:
1. Explain possible causes (clearly stated as possibilities, not definitive diagnoses).
2. Detail immediate, safe supportive care steps (temperature regulation, quiet environment, hydration, minimizing handling).
3. Determine if any symptom represents an acute medical emergency (such as tail-bobbing/open-mouth breathing, active bleeding, severe lethargy on cage floor, seizures, egg binding). Set vet_emergency_flag to true if urgent.

Respond with ONLY a valid JSON object matching this schema:
{
  "possible_causes": [
    "Cause 1 explanation tailored to this bird species",
    "Cause 2 explanation"
  ],
  "care_tips": [
    "Safe supportive step 1",
    "Safe supportive step 2"
  ],
  "vet_emergency_flag": false,
  "clinical_summary": "1-2 sentence overview of the health situation"
}`;

  let aiData = null;
  let modelUsed = null;

  try {
    const result = await generateAIContent({
      contents: prompt,
      responseMimeType: 'application/json',
      timeoutMs: 30000
    });

    aiData = result.data;
    modelUsed = result.modelUsed;

    if (!isValidAIResponse(aiData)) {
      throw new Error('Gemini returned an incomplete symptom assessment.');
    }
  } catch (error) {
    console.warn('[Symptoms AI Fallback]:', error.message);

    // Limit or connection fallback: query local database records for selected symptoms
    const matchedRecords = selectedSymptoms.flatMap(item => {
      const match = db.prepare(`
        SELECT * FROM symptoms
        WHERE LOWER(symptom) = LOWER(?) OR LOWER(symptom) LIKE LOWER(?)
        LIMIT 1
      `).get(item, `%${item}%`);
      return match ? [match] : [];
    });

    if (matchedRecords.length > 0) {
      aiData = {
        possible_causes: matchedRecords.map(r => `${r.symptom}: ${r.possible_causes}`),
        care_tips: matchedRecords.map(r => `${r.symptom}: ${r.care_tips}`),
        vet_emergency_flag: matchedRecords.some(r => r.vet_emergency === 1),
        clinical_summary: 'Evaluation generated from verified avian health database records.',
        fallback: true
      };
      modelUsed = 'database-fallback';
    } else {
      // If neither AI nor database matched, return structured error
      return sendGeminiError(res, error);
    }
  }

  // Cross-reference with database records to ensure emergency is flagged if either AI or DB indicates it
  const matchedRecords = selectedSymptoms.flatMap(item => {
    const match = db.prepare(`
      SELECT * FROM symptoms
      WHERE LOWER(symptom) = LOWER(?) OR LOWER(symptom) LIKE LOWER(?)
      LIMIT 1
    `).get(item, `%${item}%`);
    return match ? [match] : [];
  });

  const isEmergency = Boolean(aiData.vet_emergency_flag || matchedRecords.some(record => record.vet_emergency === 1));

  const summary = isEmergency
    ? 'CRITICAL WARNING: One or more symptoms indicate an avian medical emergency. Birds conceal illness until it is advanced; please contact an avian veterinarian or animal emergency hospital immediately.'
    : (aiData.clinical_summary || 'ADVISORY: Monitor your bird closely. If symptoms persist beyond 24 hours or if condition worsens, seek veterinary guidance promptly.');

  return res.json({
    possible_causes: aiData.possible_causes,
    care_tips: aiData.care_tips,
    vet_emergency_flag: isEmergency,
    disclaimer: DISCLAIMER,
    bird_name: safeBirdName || birdSpecies,
    selected_symptoms: selectedSymptoms,
    vet_emergency: isEmergency,
    recommendation_summary: summary,
    details: matchedRecords,
    ai_generated: !aiData.fallback,
    ai_model: modelUsed
  });
});

module.exports = router;
