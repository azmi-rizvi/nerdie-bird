const fs = require('fs');
const path = require('path');
const db = require('../database');

const publicSpeciesDir = path.join(__dirname, '..', '..', 'nerdie-frontend', 'public', 'species');
const backendSpeciesDir = path.join(__dirname, '..', 'uploads', 'species');

const rows = db.prepare('SELECT id, name, image_url FROM species').all();
let missing = 0;

for (const row of rows) {
  const filename = path.basename(row.image_url);
  const pubFile = path.join(publicSpeciesDir, filename);
  const bkdFile = path.join(backendSpeciesDir, filename);

  const pubExists = fs.existsSync(pubFile) && fs.statSync(pubFile).size > 1000;
  const bkdExists = fs.existsSync(bkdFile) && fs.statSync(bkdFile).size > 1000;

  if (!pubExists || !bkdExists) {
    console.error(`[MISSING] #${row.id} ${row.name}: pub=${pubExists}, bkd=${bkdExists}`);
    missing++;
  }
}

console.log(`\nVerified ${rows.length} bird species in SQLite.`);
console.log(`Missing or corrupt files: ${missing}`);
