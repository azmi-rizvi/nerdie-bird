const fs = require('fs');
const path = require('path');

const dbJsPath = path.join(__dirname, '..', 'database.js');
let content = fs.readFileSync(dbJsPath, 'utf8');

const updatedMap = `  const speciesImageMap = {
    'Cockatiel': '/species/cockatiel.jpg',
    'Budgerigar': '/species/budgerigar.jpg',
    'African Grey': '/species/african-grey.jpg',
    'Lovebird': '/species/lovebird.jpg',
    'Canary': '/species/canary.jpg',
    'Zebra Finch': '/species/zebra-finch.png',
    'Green-Cheeked Conure': '/species/green-cheeked-conure.jpg',
    'Barn Owl': '/species/barn-owl.jpg',
    'Blue Jay': '/species/blue-jay.jpg',
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
    'Indian Peafowl': '/species/indian-peafowl.jpg',
    'Resplendent Quetzal': '/species/resplendent-quetzal.jpg',
    'Superb Lyrebird': '/species/superb-lyrebird.jpg'
  };`;

content = content.replace(/const speciesImageMap = \{[\s\S]*?\};/, updatedMap.trim());
fs.writeFileSync(dbJsPath, content, 'utf8');
console.log('database.js speciesImageMap updated successfully.');
