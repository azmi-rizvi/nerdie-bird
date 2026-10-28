const fs = require('fs');
const path = require('path');
const db = require('../database');

const publicSpeciesDir = path.join(__dirname, '..', '..', 'nerdie-frontend', 'public', 'species');
const backendSpeciesDir = path.join(__dirname, '..', 'uploads', 'species');

if (!fs.existsSync(publicSpeciesDir)) fs.mkdirSync(publicSpeciesDir, { recursive: true });
if (!fs.existsSync(backendSpeciesDir)) fs.mkdirSync(backendSpeciesDir, { recursive: true });

// Map species names to exact Wikipedia page titles and local filenames
const SPECIES_CONFIG = [
  { name: 'Cockatiel', wiki: 'Cockatiel', filename: 'cockatiel.jpg' },
  { name: 'Budgerigar', wiki: 'Budgerigar', filename: 'budgerigar.jpg' },
  { name: 'African Grey', wiki: 'Grey parrot', filename: 'african-grey.jpg' },
  { name: 'Lovebird', wiki: 'Lovebird', filename: 'lovebird.jpg' },
  { name: 'Canary', wiki: 'Atlantic canary', filename: 'canary.jpg' },
  { name: 'Zebra Finch', wiki: 'Zebra finch', filename: 'zebra-finch.png' },
  { name: 'Green-Cheeked Conure', wiki: 'Green-cheeked parakeet', filename: 'green-cheeked-conure.jpg' },
  { name: 'Barn Owl', wiki: 'Barn owl', filename: 'barn-owl.jpg' },
  { name: 'Blue Jay', wiki: 'Blue jay', filename: 'blue-jay.jpg' },
  { name: 'Sun Conure', wiki: 'Sun conure', filename: 'sun-conure.jpg' },
  { name: 'Eclectus Parrot', wiki: 'Eclectus parrot', filename: 'eclectus-parrot.jpg' },
  { name: 'Victoria Crowned Pigeon', wiki: 'Victoria crowned pigeon', filename: 'victoria-crowned-pigeon.jpg' },
  { name: 'Bald Eagle', wiki: 'Bald eagle', filename: 'bald-eagle.jpg' },
  { name: 'Snowy Owl', wiki: 'Snowy owl', filename: 'snowy-owl.jpg' },
  { name: 'Common Kingfisher', wiki: 'Common kingfisher', filename: 'common-kingfisher.jpg' },
  { name: 'Sulphur-Crested Cockatoo', wiki: 'Sulphur-crested cockatoo', filename: 'sulphur-crested-cockatoo.jpg' },
  { name: 'California Quail', wiki: 'California quail', filename: 'california-quail.jpg' },
  { name: 'Red-Crowned Kakariki', wiki: 'Red-crowned parakeet', filename: 'red-crowned-kakariki.jpg' },
  { name: 'Rainbow Lorikeet', wiki: 'Rainbow lorikeet', filename: 'rainbow-lorikeet.jpg' },
  { name: 'European Goldfinch', wiki: 'European goldfinch', filename: 'european-goldfinch.jpg' },
  { name: 'Mourning Dove', wiki: 'Mourning dove', filename: 'mourning-dove.jpg' },
  { name: 'Red-Tailed Hawk', wiki: 'Red-tailed hawk', filename: 'red-tailed-hawk.jpg' },
  { name: 'Mallard Duck', wiki: 'Mallard', filename: 'mallard-duck.jpg' },
  { name: 'Hyacinth Macaw', wiki: 'Hyacinth macaw', filename: 'hyacinth-macaw.jpg' },
  { name: 'Scarlet Macaw', wiki: 'Scarlet macaw', filename: 'scarlet-macaw.jpg' },
  { name: 'Mandarin Duck', wiki: 'Mandarin duck', filename: 'mandarin-duck.jpg' },
  { name: 'Hummingbird', wiki: "Anna's hummingbird", filename: 'hummingbird.jpg' },
  { name: 'Keel-Billed Toucan', wiki: 'Keel-billed toucan', filename: 'keel-billed-toucan.jpg' },
  { name: 'Diamond Dove', wiki: 'Diamond dove', filename: 'diamond-dove.jpg' },
  { name: 'Gouldian Finch', wiki: 'Gouldian finch', filename: 'gouldian-finch.jpg' },
  { name: 'Peregrine Falcon', wiki: 'Peregrine falcon', filename: 'peregrine-falcon.jpg' },
  { name: 'Bali Myna', wiki: 'Bali myna', filename: 'bali-myna.jpg' },
  { name: 'Java Sparrow', wiki: 'Java sparrow', filename: 'java-sparrow.jpg' },
  { name: 'Wood Duck', wiki: 'Wood duck', filename: 'wood-duck.jpg' },
  { name: 'Indian Peafowl', wiki: 'Indian peafowl', filename: 'indian-peafowl.jpg' },
  { name: 'Resplendent Quetzal', wiki: 'Resplendent quetzal', filename: 'resplendent-quetzal.jpg' },
  { name: 'Superb Lyrebird', wiki: 'Superb lyrebird', filename: 'superb-lyrebird.jpg' }
];

async function fetchThumbnailUrl(wikiTitle) {
  const endpoint = new URL('https://en.wikipedia.org/w/api.php');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('titles', wikiTitle);
  endpoint.searchParams.set('prop', 'pageimages');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('pithumbsize', '900');

  const res = await fetch(endpoint.toString(), {
    headers: { 'User-Agent': 'FeatherCareBot/1.0 (contact@feathercare.local)' }
  });
  const data = await res.json();
  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.thumbnail?.source || null;
}

async function downloadImage(url, destPaths) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FeatherCareBot/1.0 (contact@feathercare.local)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  for (const dest of destPaths) {
    fs.writeFileSync(dest, buffer);
  }
  return buffer.length;
}

async function run() {
  console.log(`Starting image synchronization for ${SPECIES_CONFIG.length} bird species...`);
  const updateStmt = db.prepare('UPDATE species SET image_url = ? WHERE LOWER(name) = LOWER(?)');

  for (const item of SPECIES_CONFIG) {
    const pubDest = path.join(publicSpeciesDir, item.filename);
    const bkdDest = path.join(backendSpeciesDir, item.filename);
    const localUrl = `/species/${item.filename}`;

    try {
      // Check if file already exists locally and has valid size (> 5KB)
      if (fs.existsSync(pubDest) && fs.statSync(pubDest).size > 5000) {
        if (!fs.existsSync(bkdDest) || fs.statSync(bkdDest).size <= 5000) {
          fs.copyFileSync(pubDest, bkdDest);
        }
        console.log(`[EXISTS] ${item.name} -> ${item.filename}`);
        updateStmt.run(localUrl, item.name);
        continue;
      }

      console.log(`[FETCHING] Finding canonical photo for ${item.name} (${item.wiki})...`);
      const thumbUrl = await fetchThumbnailUrl(item.wiki);

      if (!thumbUrl) {
        console.warn(`[WARN] No thumbnail found for ${item.name}`);
        continue;
      }

      const bytes = await downloadImage(thumbUrl, [pubDest, bkdDest]);
      console.log(`[SUCCESS] Downloaded ${item.name} (${bytes} bytes) -> ${item.filename}`);

      // Update database
      const info = updateStmt.run(localUrl, item.name);
      console.log(`[DB UPDATED] ${item.name} set to ${localUrl} (rows affected: ${info.changes})`);

      // Gentle pause to respect Wikipedia API limits
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`[ERROR] Processing ${item.name}:`, err.message);
    }
  }

  console.log('\nAll bird species image synchronization complete!');
  const rows = db.prepare('SELECT id, name, image_url FROM species').all();
  console.log(`\nVerified database entries (${rows.length}):`);
  rows.forEach(r => console.log(`  #${r.id} ${r.name.padEnd(26)} -> ${r.image_url}`));
}

run().catch(console.error);
