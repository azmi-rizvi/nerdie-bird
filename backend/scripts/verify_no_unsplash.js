const fs = require('fs');
const content = fs.readFileSync('backend/database.js', 'utf8');
const matches = content.match(/https:\/\/images\.unsplash\.com[^\s"']+/g);
console.log('Unsplash matches in backend/database.js:', matches ? matches.length : 0);
if (matches) console.log(matches);
