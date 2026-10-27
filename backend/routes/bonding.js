const express = require('express');
const { generateAIContent, sendGeminiError } = require('../utils/gemini');

const router = express.Router();

function isValidTip(data) {
  return data && typeof data === 'object' &&
    typeof data.bonding_tip_title === 'string' && data.bonding_tip_title.trim() &&
    typeof data.tip_content === 'string' && data.tip_content.trim() &&
    typeof data.recommended_time === 'string' && data.recommended_time.trim();
}

// POST /api/bonding-tip or /api/bonding
router.post('/', async (req, res) => {
  const { species, age, notes, birdName } = req.body || {};
  const birdSpecies = typeof species === 'string' && species.trim()
    ? species.trim().slice(0, 100)
    : 'Companion bird';
  const birdAge = typeof age === 'string' && age.trim() ? age.trim().slice(0, 100) : 'not provided';
  const behaviorNotes = typeof notes === 'string' ? notes.trim().slice(0, 2000) : '';
  const name = typeof birdName === 'string' && birdName.trim() ? birdName.trim().slice(0, 100) : 'your bird';

  const prompt = `You are a compassionate, expert avian behavior educator.
Create one safe, positive-reinforcement bonding activity personalized to this specific bird:
- Bird name: ${JSON.stringify(name)}
- Species: ${JSON.stringify(birdSpecies)}
- Age: ${JSON.stringify(birdAge)}
- Owner's recent behavior notes: ${JSON.stringify(behaviorNotes || 'No specific behavior notes provided.')}

Tailor the exercise to the species' intelligence and emotional tendencies, factoring in any behavior notes (such as fear of hands, aggression, whistling habits, or high energy).
Respect the bird's comfort: recommend pausing if the bird exhibits fear or avoidance cues. Never recommend forced handling or punishment.

Return ONLY a valid JSON object matching this schema:
{
  "bonding_tip_title": "Short creative activity title",
  "tip_content": "Practical step-by-step instructions and positive body-language signs to watch for",
  "recommended_time": "Morning, Afternoon, or Evening"
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

    if (!isValidTip(aiData)) {
      throw new Error('Gemini returned an incomplete bonding tip.');
    }
  } catch (error) {
    console.warn('[Bonding AI Fallback]:', error.message);

    // Rate limit or connection fallback: provide rule-based personalized activity
    const isCautious = behaviorNotes.toLowerCase().includes('fear') ||
                       behaviorNotes.toLowerCase().includes('bite') ||
                       behaviorNotes.toLowerCase().includes('shy') ||
                       behaviorNotes.toLowerCase().includes('scared');

    if (isCautious) {
      aiData = {
        bonding_tip_title: 'Gentle Proximity & Reading Aloud',
        tip_content: `Sit comfortably next to ${name}'s cage without making direct sustained eye contact. Read a book or talk in a calm, soft voice for 10-15 minutes. This teaches ${name} that your presence is safe, non-demanding, and soothing.`,
        recommended_time: 'Evening',
        fallback: true
      };
    } else {
      aiData = {
        bonding_tip_title: 'Target Whistling & Treat Foraging',
        tip_content: `Offer a favorite healthy treat (like a small sunflower seed or spray millet) through cage bars using gentle verbal encouragement. Pair with a friendly whistle or praise every time ${name} steps closer willingly.`,
        recommended_time: 'Late Morning',
        fallback: true
      };
    }
    modelUsed = 'expert-fallback';
  }

  return res.json({
    bonding_tip_title: aiData.bonding_tip_title,
    tip_content: aiData.tip_content,
    recommended_time: aiData.recommended_time,
    bird_name: name,
    species: birdSpecies,
    ai_generated: !aiData.fallback,
    ai_model: modelUsed
  });
});

module.exports = router;
