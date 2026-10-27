const express = require('express');
const router = express.Router();
const { generateAIContent } = require('../utils/gemini');

// POST /api/bonding-tip - Generate personalized daily bonding activity
router.post('/', async (req, res) => {
  try {
    const { species, age, notes, birdName } = req.body;

    const birdSpecies = (species || 'Companion Bird').trim();
    const birdAge = (age || 'Adult').trim();
    const behaviorNotes = (notes || 'Enjoys attention, curiosity, and interaction').trim();
    const name = (birdName || 'Your bird').trim();

    let aiData = null;

    try {
      const promptText = `
You are an expert avian behaviorist and companion bird trainer.
Create an engaging, positive-reinforcement based bonding exercise for a bird:
- Name: ${name}
- Species: ${birdSpecies}
- Age: ${birdAge}
- Recent Behavioral Notes & Habits: "${behaviorNotes}"

Design a fun, gentle, trust-building bonding activity specifically tailored to this species and these behavior notes.
If notes mention fear or biting, focus on non-intrusive desensitization, target training, or vocal mimicry games.
If notes mention high energy or intelligence, incorporate foraging puzzles or trick training.

Respond with ONLY a valid JSON object strictly matching this schema:
{
  "bonding_tip_title": "Short creative activity title (e.g. Target Stick Gentle Steps, Soft Whistle Dialogue)",
  "tip_content": "Detailed step-by-step instructions on how the owner can carry out this bonding activity today, including behavioral body language to watch for.",
  "recommended_time": "Morning / Afternoon / Evening"
}
`;

      const aiResponse = await generateAIContent({
        contents: promptText,
        responseMimeType: 'application/json'
      });

      aiData = aiResponse.data;
    } catch (aiErr) {
      console.warn('[Bonding AI Warning] Gemini API unavailable or errored, using rule-based fallback:', aiErr.message);
    }

    if (!aiData || !aiData.bonding_tip_title) {
      // High-quality fallback if AI fails
      aiData = {
        bonding_tip_title: `Gentle Flock Time with ${name}`,
        tip_content: `Sit comfortably near ${name}'s cage or play stand at eye level. Read a book or talk in a calm, melodic voice for 10-15 minutes without forcing physical contact. Offer a favorite treat from your open palm when they exhibit relaxed posture (preening or resting on one foot).`,
        recommended_time: 'Evening'
      };
    }

    res.json({
      bonding_tip_title: aiData.bonding_tip_title,
      tip_content: aiData.tip_content,
      recommended_time: aiData.recommended_time || 'Evening',
      bird_name: name,
      species: birdSpecies
    });
  } catch (err) {
    console.error('Error generating bonding tip:', err);
    res.status(500).json({ error: 'Failed to generate bonding tip: ' + err.message });
  }
});

module.exports = router;
