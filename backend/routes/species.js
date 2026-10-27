const express = require('express');
const router = express.Router();
const db = require('../database');

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

// GET /api/species - Retrieve all species with optional ?search= and ?type=
router.get('/', (req, res) => {
  try {
    const { search, type } = req.query;
    let query = 'SELECT * FROM species WHERE 1=1';
    const params = [];

    if (type && type !== 'All') {
      // Support matching "Pet" to non-wild bird types
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
