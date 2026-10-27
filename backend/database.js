const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'feathercare.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  // 1. Species table
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      habitat TEXT,
      diet TEXT,
      cage_setup TEXT,
      social_needs TEXT,
      lifespan TEXT,
      fun_facts TEXT,
      image_url TEXT
    );
  `);

  // 2. User Birds table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_birds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species_id INTEGER,
      age TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE SET NULL
    );
  `);

  // 3. Symptoms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symptom TEXT NOT NULL UNIQUE,
      possible_causes TEXT NOT NULL,
      care_tips TEXT NOT NULL,
      vet_emergency INTEGER DEFAULT 0,
      description TEXT
    );
  `);

  // Seed Species if table is empty
  const countSpecies = db.prepare('SELECT COUNT(*) as count FROM species').get().count;
  if (countSpecies === 0) {
    const insertSpecies = db.prepare(`
      INSERT INTO species (name, type, habitat, diet, cage_setup, social_needs, lifespan, fun_facts, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const speciesSeedData = [
      [
        "Cockatiel",
        "Parrots",
        "Native to the arid and semi-arid inland regions of Australia, often found near bodies of fresh water and open grasslands.",
        "High-quality formulated pellets (60-70%), balanced seed mix, fresh leafy greens (kale, broccoli, spinach), sprouted seeds, and occasional bird-safe fruits (apples, blueberries).",
        "Minimum 24\" x 24\" x 30\" with horizontal wire spacing for climbing. Multiple natural wood perches of varying diameters, foraging shredder toys, and a calcium cuttlebone.",
        "Extremely social and affectionate flock animals. Require at least 1-2 hours of direct interactive out-of-cage time daily to prevent loneliness or stress-related feather plucking.",
        "15 - 25 years",
        "Cockatiels express their mood using their crest feathers: upright when alert or curious, flattened flat against the head when defensive, and relaxed at a gentle 45-degree angle.",
        "/uploads/species/cockatiel.jpg"
      ],
      [
        "Budgerigar",
        "Parrots",
        "Native to scrublands, open woodlands, and grasslands across the vast interior of Australia.",
        "Specialized small-hookbill pellets, millet sprays as training treats, fresh greens, grated carrots, broccoli florets, and clean fresh water refreshed daily.",
        "Wide flight cage (at least 30\" wide x 18\" deep) with bar spacing no wider than 1/2 inch to prevent injury. Include swings, ladders, and balsa wood shredding toys.",
        "Energetic, cheerful, and gregarious. They thrive when kept in pairs or given continuous vocal engagement, whistle routines, and companionship with their human flock.",
        "7 - 15 years",
        "A budgie holds the Guinness World Record for the largest vocabulary of any bird — a budgie named Puck knew over 1,700 words!",
        "/uploads/species/budgerigar.jpg"
      ],
      [
        "African Grey",
        "Parrots",
        "Dense lowland rainforests, gallery forests, and wooded savannah edges of Central and West Africa.",
        "Certified organic parrot pellets, varied fresh vegetables (sweet potato, squash, dark leafy greens), limited nuts (walnuts, almonds), palm fruit, and low-sugar fruits.",
        "Large cage at least 36\" x 24\" x 48\" with heavy-duty non-toxic powder coating. Diverse destructible wood toys, puzzle foraging drawers, and large natural branch perches.",
        "Exceptionally high cognitive needs equivalent to a 4-to-5-year-old human child. Needs 3-4 hours of interactive play, mental puzzles, and structured companionship daily.",
        "40 - 60+ years",
        "African Greys can understand abstract concepts, count items, identify colors, and use syntax, famously demonstrated by Dr. Irene Pepperberg's research with Alex the Grey.",
        "/uploads/species/african-grey.jpg"
      ],
      [
        "Lovebird",
        "Parrots",
        "Dry wooded country, savannas, and scrublands of southwestern and eastern Africa.",
        "Small parrot pellet blend, fresh chopped greens, sprouted seeds, apples, bell peppers with seeds, and occasional cooked grains like quinoa.",
        "Minimum 24\" x 24\" x 24\" cage with 1/2-inch bar spacing. Lots of paper shredding toys, rope swings, and safe wooden chew blocks.",
        "Intensely loyal, curious, and energetic. Contrary to myth, single lovebirds can thrive if bonded closely with a human companion who gives them daily attention.",
        "10 - 15 years",
        "Female peach-faced lovebirds tuck strips of bark, paper, and nesting material into their rump feathers to carry them back to build intricate nests!",
        "/uploads/species/lovebird.jpg"
      ],
      [
        "Canary",
        "Finches",
        "Orchards, valleys, and open pine forests of the Canary Islands, Azores, and Madeira.",
        "Canary seed blend containing canary grass seed and rape seed, fortified pellets, egg food during molting, fresh dandelion greens, and cucumber slices.",
        "Horizontal flight cage at least 30\" wide since canaries fly back and forth rather than climb. Space perches far apart to encourage wing exercise.",
        "Independent and territorial. Male canaries are renowned solitary singers and generally prefer being housed alone without cage mates.",
        "10 - 15 years",
        "Male canaries learn and reorganize their songs every single spring to attract mates, growing new brain neurons each breeding season.",
        "/uploads/species/canary.jpg"
      ],
      [
        "Zebra Finch",
        "Finches",
        "Grasslands, arid savannas, and sub-tropical regions throughout central and inland Australia.",
        "High-grade finch seed mix (millets, grass seeds), finch pellets, finely chopped dark greens, hard-boiled egg with crushed shell, and fresh clean water.",
        "Flight-focused cage (minimum 30\" length) with 1/4\" to 3/8\" bar spacing. Shallow dishes for daily water bathing, which finches thoroughly enjoy.",
        "Strict flock species — should never be kept alone. Always house in pairs or small peaceful colonies with plenty of space.",
        "5 - 10 years",
        "Zebra finches have distinctive 'beep-beep' trumpet-like calls and their courtship dance includes rhythmic beak wipes and puffing feathers.",
        "/uploads/species/zebra-finch.png"
      ],
      [
        "Green-Cheeked Conure",
        "Parrots",
        "Forests and woodlands of South America, including Brazil, Bolivia, and north-western Argentina.",
        "Quality small-conure pellet diet, fresh vegetables (carrots, sweet corn, zucchini, peas), occasional papaya or mango, and walnut nibbles.",
        "Roomy cage at least 24\" x 24\" x 30\". Loves climbing and swinging, so install boings, ladders, fleece snuggle perches, and bell toys.",
        "Affectionate, goofy, and playful acrobats. Known as 'pocket clowns', they form very close cuddly bonds with their owners and enjoy gentle head scratches.",
        "20 - 30 years",
        "Green-cheeked conures are among the quietest of the conure family and love sleeping on their backs or hanging upside-down by one foot!",
        "/uploads/species/green-cheeked-conure.jpg"
      ],
      [
        "Barn Owl",
        "Wild Birds",
        "Farmlands, open meadows, marshes, and old barns across nearly every continent except polar regions.",
        "Strict carnivore: small mammals such as voles, field mice, shrews, and occasional small reptiles or insects.",
        "Wild species: not suited as domestic pets. Requires specialized wildlife sanctuary aviary with high nesting perches and flight corridors.",
        "Solitary or monogamous pairs in the wild. Sensitive to human disturbance and active nocturnally.",
        "4 - 15 years in wild, up to 20 in sanctuaries",
        "Barn owls have asymmetrical ear openings on the sides of their skull, allowing them to pinpoint sounds in complete pitch-black darkness.",
        "/uploads/species/barn-owl.jpg"
      ],
      [
        "Blue Jay",
        "Wild Birds",
        "Deciduous and mixed forests, parks, and suburban areas across eastern and central North America.",
        "Omnivorous wild diet: acorns, nuts, seeds, wild fruits, berries, insects, and backyard sunflower seed feeders.",
        "Protected wild songbird (Migratory Bird Treaty Act) — cannot be kept as a pet. Best observed via backyard bird baths and feeding platforms.",
        "Complex social hierarchies, tight-knit family units, and highly communicative sentinels for forest wildlife.",
        "7 - 15 years in wild",
        "Blue Jays mimic red-shouldered hawk calls to warn other jays or to trick other birds into fleeing backyard feeding spots!",
        "/uploads/species/blue-jay.jpg"
      ]
    ];

    const insertManySpecies = db.transaction((rows) => {
      for (const row of rows) insertSpecies.run(...row);
    });
    insertManySpecies(speciesSeedData);
    console.log(`Seeded ${speciesSeedData.length} bird species into database.`);
  }

  // Seed Symptoms if table is empty
  const countSymptoms = db.prepare('SELECT COUNT(*) as count FROM symptoms').get().count;
  if (countSymptoms === 0) {
    const insertSymptom = db.prepare(`
      INSERT INTO symptoms (symptom, possible_causes, care_tips, vet_emergency, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const symptomSeedData = [
      [
        "Not eating",
        "Crop impaction or infection, systemic bacterial infection, heavy metal ingestion (lead/zinc), beak pain or injury, sudden dietary change, severe stress, or organ dysfunction.",
        "Keep the bird warm (82-85°F / 28-29°C) in a quiet, draft-free room. Offer high-palatability foods like spray millet or warm sweet potato puree. Never force-feed liquids into a weak bird's beak due to aspiration danger. Seek immediate vet care.",
        1,
        "Refusal of food or 'faking eating' where the bird inspects seeds without cracking and swallowing them. Birds have fast metabolic rates and cannot survive prolonged fasting."
      ],
      [
        "Feather loss",
        "Seasonal molting, boredom/loneliness, environmental stress, lack of humidity, nutritional deficit (vitamin A or protein deficiency), external mites, or hormonal frustration.",
        "Mist bird with warm water daily or provide shallow bathing pans. Introduce destructible chew and shredding toys (shredder paper, woven palm). Improve diet to high-grade pellets and leafy greens. Check skin under good light.",
        0,
        "Thinning feathers or bald patches around head, chest, or under wings. If skin is broken or bleeding blood feathers appear, treat as urgent."
      ],
      [
        "Low activity",
        "Hypothermia/chilling, respiratory infection, systemic illness, egg binding in females, malnutrition, or kidney/liver distress.",
        "Set up a hospital cage: place a low-wattage ceramic heating pad or warm towel under half the cage bottom so the bird can choose warmth. Keep food and water easily accessible near perches. Dim lights and reduce noise.",
        1,
        "Bird sits puffed up on the cage floor or low perch, eyes closed during daylight, sleeping excessively, reluctant to interact or vocalize."
      ],
      [
        "Breathing problem",
        "Aerosol toxicity (Teflon PTFE nonstick fumes, scented candles, aerosol sprays), fungal Aspergillosis, air sac mites, lung congestion, or organ enlargement pressing on air sacs.",
        "Remove all potential airborne contaminants immediately and ensure pure, fresh air. Place bird in a warm, quiet environment. DO NOT stress or restrain the bird, as panic can cause fatal asphyxiation.",
        1,
        "Tail bobbing up and down in sync with breathing, clicking or wheezing sounds, open-mouth gasping, or extended neck while breathing."
      ],
      [
        "Unusual stool",
        "Bacterial or fungal enteritis, heavy metal toxicosis, parasitic infection (Giardia/Coccidia), excessive fruit consumption (polyuria vs diarrhea), or kidney disease.",
        "Differentiate polyuria (too much liquid urine around normal fecal cylinder) from true diarrhea (unformed feces). Provide fresh water with bird-safe electrolyte solution. Line cage floor with clean white paper to collect samples for the vet.",
        1,
        "Watery droppings, bright neon green or mustard yellow feces, bloody or black tarry droppings, or whole undigested seeds present in fecal matter."
      ],
      [
        "Excessive scratching",
        "Scaly face/leg mites (Cnemidocoptes), lice, dry air during winter heating, sheath flaking during molting, or contact allergic dermatitis.",
        "Increase ambient humidity using a cool-mist humidifier (aim for 50-60% relative humidity). Provide daily baths or misting. Check beak and legs for honeycomb-like crusty build-ups indicative of mites.",
        0,
        "Frequent scratching of head, face, or ears with claws, vigorous rubbing against perches, or agitation when preening."
      ],
      [
        "Tail bobbing",
        "Severe respiratory difficulty, pneumonia, air sac mites, abdominal mass or egg binding pressing on respiratory system.",
        "Immediate emergency intervention required. Keep bird calm, warm, and avoid any handling. Place near gentle warmth without drafts and contact an avian hospital immediately.",
        1,
        "Rhythmic downward and upward bobbing of the tail feathers timed with each inhalation and exhalation."
      ],
      [
        "Bleeding / Broken Blood Feather",
        "Night fright trauma, cage collision, clipped wing damage, or accidental snagging on wire/toys.",
        "Apply direct pressure with clean gauze. Coat the bleeding shaft generously with cornstarch or styptic powder. If bleeding persists after 2 minutes, the broken shaft must be carefully extracted by tweezers at the base.",
        1,
        "Active dripping or spurting blood from a newly developing vascular pinfeather or wing laceration."
      ]
    ];

    const insertManySymptoms = db.transaction((rows) => {
      for (const row of rows) insertSymptom.run(...row);
    });
    insertManySymptoms(symptomSeedData);
    console.log(`Seeded ${symptomSeedData.length} symptom records into database.`);
  }

  // Seed sample user birds if table is empty
  const countUserBirds = db.prepare('SELECT COUNT(*) as count FROM user_birds').get().count;
  if (countUserBirds === 0) {
    const cockatiel = db.prepare('SELECT id FROM species WHERE name = ?').get('Cockatiel');
    const budgie = db.prepare('SELECT id FROM species WHERE name = ?').get('Budgerigar');
    const conure = db.prepare('SELECT id FROM species WHERE name = ?').get('Green-Cheeked Conure');

    const insertBird = db.prepare(`
      INSERT INTO user_birds (name, species_id, age, notes)
      VALUES (?, ?, ?, ?)
    `);

    if (cockatiel) {
      insertBird.run("Sunny", cockatiel.id, "2 years", "Loves whistling the Addams Family theme. Enjoys fresh broccoli florets and evening head scratches.");
    }
    if (budgie) {
      insertBird.run("Pip", budgie.id, "1 year", "Super energetic and chatty. Mastered stepping onto finger and loves his bell swing.");
    }
    if (conure) {
      insertBird.run("Kiwi", conure.id, "3 years", "Very cuddly pocket clown. Prefers warm sweet potato and sleeps tucked in his fleece corner.");
    }
    console.log('Seeded sample user birds into database.');
  }
}

// Run initialization
initDatabase();

module.exports = db;
