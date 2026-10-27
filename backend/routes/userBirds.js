const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/my-birds - List all saved user birds with species info
router.get('/', (req, res) => {
  try {
    const query = `
      SELECT 
        ub.id,
        ub.name,
        ub.species_id,
        ub.age,
        ub.notes,
        ub.created_at,
        s.name AS species_name,
        s.type AS species_type,
        s.image_url AS species_image
      FROM user_birds ub
      LEFT JOIN species s ON ub.species_id = s.id
      ORDER BY ub.id DESC
    `;
    const birds = db.prepare(query).all();
    res.json(birds);
  } catch (err) {
    console.error('Error fetching user birds:', err);
    res.status(500).json({ error: 'Failed to fetch user birds' });
  }
});

// GET /api/my-birds/:id - Retrieve a specific user bird
router.get('/:id', (req, res) => {
  try {
    const query = `
      SELECT 
        ub.id,
        ub.name,
        ub.species_id,
        ub.age,
        ub.notes,
        ub.created_at,
        s.name AS species_name,
        s.type AS species_type,
        s.image_url AS species_image
      FROM user_birds ub
      LEFT JOIN species s ON ub.species_id = s.id
      WHERE ub.id = ?
    `;
    const bird = db.prepare(query).get(req.params.id);
    if (!bird) {
      return res.status(404).json({ error: 'Bird profile not found' });
    }
    res.json(bird);
  } catch (err) {
    console.error('Error fetching bird profile:', err);
    res.status(500).json({ error: 'Failed to fetch bird profile' });
  }
});

// POST /api/my-birds - Create a new bird profile
router.post('/', (req, res) => {
  try {
    const { name, species_id, age, notes } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Bird name is required' });
    }

    const speciesId = species_id ? parseInt(species_id, 10) : null;

    const stmt = db.prepare(`
      INSERT INTO user_birds (name, species_id, age, notes)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(name.trim(), speciesId, age ? age.trim() : null, notes ? notes.trim() : null);

    const newBird = db.prepare(`
      SELECT 
        ub.id,
        ub.name,
        ub.species_id,
        ub.age,
        ub.notes,
        ub.created_at,
        s.name AS species_name,
        s.type AS species_type,
        s.image_url AS species_image
      FROM user_birds ub
      LEFT JOIN species s ON ub.species_id = s.id
      WHERE ub.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newBird);
  } catch (err) {
    console.error('Error creating bird profile:', err);
    res.status(500).json({ error: 'Failed to create bird profile: ' + err.message });
  }
});

// PUT /api/my-birds/:id - Update a bird profile or add health/behavioral notes
router.put('/:id', (req, res) => {
  try {
    const birdId = req.params.id;
    const existing = db.prepare('SELECT * FROM user_birds WHERE id = ?').get(birdId);

    if (!existing) {
      return res.status(404).json({ error: 'Bird profile not found' });
    }

    const { name, species_id, age, notes } = req.body;

    const updatedName = name !== undefined && name.trim() !== '' ? name.trim() : existing.name;
    const updatedSpeciesId = species_id !== undefined ? (species_id ? parseInt(species_id, 10) : null) : existing.species_id;
    const updatedAge = age !== undefined ? age.trim() : existing.age;
    const updatedNotes = notes !== undefined ? notes.trim() : existing.notes;

    db.prepare(`
      UPDATE user_birds
      SET name = ?, species_id = ?, age = ?, notes = ?
      WHERE id = ?
    `).run(updatedName, updatedSpeciesId, updatedAge, updatedNotes, birdId);

    const updatedBird = db.prepare(`
      SELECT 
        ub.id,
        ub.name,
        ub.species_id,
        ub.age,
        ub.notes,
        ub.created_at,
        s.name AS species_name,
        s.type AS species_type,
        s.image_url AS species_image
      FROM user_birds ub
      LEFT JOIN species s ON ub.species_id = s.id
      WHERE ub.id = ?
    `).get(birdId);

    res.json(updatedBird);
  } catch (err) {
    console.error('Error updating bird profile:', err);
    res.status(500).json({ error: 'Failed to update bird profile: ' + err.message });
  }
});

// DELETE /api/my-birds/:id - Remove a bird profile
router.delete('/:id', (req, res) => {
  try {
    const birdId = req.params.id;
    const existing = db.prepare('SELECT * FROM user_birds WHERE id = ?').get(birdId);

    if (!existing) {
      return res.status(404).json({ error: 'Bird profile not found' });
    }

    db.prepare('DELETE FROM user_birds WHERE id = ?').run(birdId);

    res.json({ message: `Bird profile "${existing.name}" (ID ${birdId}) removed successfully.`, id: birdId });
  } catch (err) {
    console.error('Error deleting bird profile:', err);
    res.status(500).json({ error: 'Failed to delete bird profile' });
  }
});

module.exports = router;
