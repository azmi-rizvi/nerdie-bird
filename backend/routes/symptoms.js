const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/symptoms - Retrieve all pre-populated symptoms
router.get('/', (req, res) => {
  try {
    const symptoms = db.prepare('SELECT * FROM symptoms ORDER BY symptom ASC').all();
    res.json(symptoms);
  } catch (err) {
    console.error('Error fetching symptoms:', err);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// POST /api/symptoms - Check one or more symptoms
router.post('/', (req, res) => {
  try {
    let { symptoms, symptom, birdName } = req.body;

    // Normalize to an array of symptom strings
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

    // Fetch matching symptom records from database
    const matchedRecords = [];
    for (const item of selectedSymptoms) {
      const match = db.prepare(`
        SELECT * FROM symptoms 
        WHERE LOWER(symptom) = LOWER(?) OR LOWER(symptom) LIKE LOWER(?)
      `).get(item, `%${item}%`);

      if (match) {
        // avoid duplicates
        if (!matchedRecords.some(r => r.id === match.id)) {
          matchedRecords.push(match);
        }
      } else {
        // Add a generic record for unrecognized custom symptom
        matchedRecords.push({
          id: null,
          symptom: item,
          possible_causes: `Non-specific symptom reported: "${item}". May stem from mild environmental stress, dietary change, or early stage avian illness.`,
          care_tips: "Monitor closely for other symptoms (fluffed feathers, appetite decline, altered droppings). Maintain warm temperature (80-84°F) and quiet surroundings.",
          vet_emergency: 0,
          description: `User-reported symptom: ${item}`
        });
      }
    }

    // Determine overall emergency status
    const isVetEmergency = matchedRecords.some(r => r.vet_emergency === 1);

    // Aggregate causes and care tips
    const causesList = matchedRecords.map(r => `• ${r.symptom}: ${r.possible_causes}`).join('\n\n');
    const careTipsList = matchedRecords.map(r => `• ${r.symptom}: ${r.care_tips}`).join('\n\n');

    let recommendationSummary = isVetEmergency
      ? "CRITICAL WARNING: One or more symptoms indicate a potential avian emergency. Birds conceal illness until it is advanced; please contact an avian veterinarian or animal emergency clinic immediately."
      : "ADVISORY: These symptoms may be manageable with close observation, environmental adjustments, and proper hydration. If condition does not improve within 24 hours, seek veterinary guidance.";

    res.json({
      bird_name: birdName || "Your bird",
      selected_symptoms: selectedSymptoms,
      matched_count: matchedRecords.length,
      vet_emergency: isVetEmergency,
      recommendation_summary: recommendationSummary,
      possible_causes: causesList,
      care_tips: careTipsList,
      details: matchedRecords
    });
  } catch (err) {
    console.error('Error checking symptoms:', err);
    res.status(500).json({ error: 'Failed to process symptom check: ' + err.message });
  }
});

module.exports = router;
