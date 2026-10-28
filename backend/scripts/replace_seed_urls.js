const fs = require('fs');
const path = require('path');

const dbJsPath = path.join(__dirname, '..', 'database.js');
let content = fs.readFileSync(dbJsPath, 'utf8');

const slugMap = {
  'Sun Conure': '/species/sun-conure.jpg',
  'Eclectus Parrot': '/species/eclectus-parrot.jpg',
  'Victoria Crowned Pigeon': '/species/victoria-crowned-pigeon.jpg',
  'Bald Eagle': '/species/bald-eagle.jpg',
  'Snowy Owl': '/species/snowy-owl.jpg',
  'Common Kingfisher': '/species/common-kingfisher.jpg',
  'Sulphur-Crested Cockatoo': '/species/sulphur-crested-cockatoo.jpg',
  'California Quail': '/species/california-quail.jpg',
  'Red-Crowned Kakariki': '/species/red-crowned-kakariki.jpg',
  'Rainbow Lorikeet': '/species/rainbow-lorikeet.jpg',
  'European Goldfinch': '/species/european-goldfinch.jpg',
  'Mourning Dove': '/species/mourning-dove.jpg',
  'Red-Tailed Hawk': '/species/red-tailed-hawk.jpg',
  'Mallard Duck': '/species/mallard-duck.jpg',
  'Hyacinth Macaw': '/species/hyacinth-macaw.jpg',
  'Scarlet Macaw': '/species/scarlet-macaw.jpg',
  'Mandarin Duck': '/species/mandarin-duck.jpg',
  'Hummingbird': '/species/hummingbird.jpg',
  'Keel-Billed Toucan': '/species/keel-billed-toucan.jpg',
  'Diamond Dove': '/species/diamond-dove.jpg',
  'Gouldian Finch': '/species/gouldian-finch.jpg',
  'Peregrine Falcon': '/species/peregrine-falcon.jpg',
  'Bali Myna': '/species/bali-myna.jpg',
  'Java Sparrow': '/species/java-sparrow.jpg',
  'Wood Duck': '/species/wood-duck.jpg',
  'Indian Peafowl': '/species/indian-peafowl.jpg'
};

for (const [name, imgPath] of Object.entries(slugMap)) {
  const regex = new RegExp(`("${name}",[\\s\\S]*?)"https:\\/\\/images\\.unsplash\\.com\\/[^"]+"`, 'g');
  content = content.replace(regex, `$1"${imgPath}"`);
}

fs.writeFileSync(dbJsPath, content, 'utf8');
console.log('database.js speciesSeedData URLs replaced with local /species/*.jpg paths.');
