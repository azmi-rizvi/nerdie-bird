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

  // 4. Expanded 35 Diverse Bird Species Seed Data
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
      "/species/cockatiel.jpg"
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
      "/species/budgerigar.jpg"
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
      "/species/african-grey.jpg"
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
      "/species/lovebird.jpg"
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
      "/species/canary.jpg"
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
      "/species/zebra-finch.png"
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
      "/species/green-cheeked-conure.jpg"
    ],
    [
      "Barn Owl",
      "Raptors",
      "Farmlands, open meadows, marshes, and old barns across nearly every continent except polar regions.",
      "Strict carnivore: small mammals such as voles, field mice, shrews, and occasional small reptiles or insects.",
      "Wild species: not suited as domestic pets. Requires specialized wildlife sanctuary aviary with high nesting perches and flight corridors.",
      "Solitary or monogamous pairs in the wild. Sensitive to human disturbance and active nocturnally.",
      "4 - 15 years in wild, up to 20 in sanctuaries",
      "Barn owls have asymmetrical ear openings on the sides of their skull, allowing them to pinpoint sounds in complete pitch-black darkness.",
      "/species/barn-owl.jpg"
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
      "/species/blue-jay.jpg"
    ],
    [
      "Sun Conure",
      "Parrots",
      "Tropical forests, dry savannas, and palm groves of northeastern South America (Guyana, northern Brazil, Venezuela).",
      "Formulated conure pellets, diverse seeds, diced papaya, mango, sweet corn, leafy greens, and cracked walnuts.",
      "Roomy enclosure (at least 30\" x 24\" x 36\") with 5/8\" bar spacing. Provide swings, foraging puzzles, and destructible balsa chew toys.",
      "Warm, extremely loving, and demonstrative. They bond deeply with caretakers and thrive with 2-3 hours of out-of-cage interaction daily.",
      "20 - 30 years",
      "Sun conures are famous for their sunset-colored golden plumage and piercing vocal contact calls that can carry over two miles in the wild!",
      "https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Eclectus Parrot",
      "Parrots",
      "Lowland tropical rainforests and coastal woodlands of the Solomon Islands, Sumba, and northeastern Australia.",
      "High-fiber fresh diet: 70% fresh produce (pomegranates, figs, dark leafy greens, carrots) and specialized low-additive organic pellets.",
      "Spacious flight cage (minimum 36\" x 30\" x 60\") with varied natural eucalyptus branches and safe wood foraging chew blocks.",
      "Gentle, calm, and contemplative companions that appreciate quiet environments, predictable routines, and positive encouragement.",
      "30 - 45 years",
      "Eclectus parrots exhibit extreme sexual dimorphism: males are brilliant emerald green while females are regal crimson and royal purple!",
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Victoria Crowned Pigeon",
      "Pigeons & Doves",
      "Lowland swamp and sago palm forests of northern New Guinea and surrounding offshore islands.",
      "Fallen tropical fruits, palm berries, seeds, small snails, and coarse mineral grit.",
      "Expansive ground aviary with natural soil substrate, shaded nesting shelters, and low flat roosting platforms.",
      "Peaceful flock birds that form lifelong monogamous pairs and communicate with deep, resonant booming calls.",
      "20 - 25 years",
      "Victoria Crowned Pigeons are the largest living pigeon species on Earth, reaching the size of a female turkey with lacy crown crests!",
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Bald Eagle",
      "Raptors",
      "Seacoasts, rivers, large lakes, and marshes with abundant fish and mature perching trees across North America.",
      "Carnivorous wild diet: fresh fish (salmon, trout), waterfowl, and occasional carrion.",
      "Protected wild raptor. Housed only in specialized licensed wildlife sanctuaries with minimum 100-foot flight rehabilitation aviaries.",
      "Monogamous pairs with aerial cartwheel courtship displays and strong multi-square-mile territorial protection.",
      "20 - 30 years in wild, up to 40 in captivity",
      "Bald eagles build the largest tree nests of any bird species — record nests have measured 10 feet wide and weighed nearly 3 tons!",
      "https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Snowy Owl",
      "Raptors",
      "Open, treeless Arctic tundra, coastal dunes, and windswept northern prairies.",
      "Strict carnivore: lemmings, snowshoe hares, ptarmigan, and coastal waterfowl.",
      "Protected northern raptor. Requires specialized cold-weather sanctuary flight habitats with elevated stone mounds and shade.",
      "Solitary, nomadic hunter active during both day and night throughout the continuous Arctic summer daylight.",
      "10 - 15 years in wild, up to 28 in sanctuaries",
      "Unlike most nocturnal owls, snowy owls are diurnal and have thick plumage covering their talons to thrive in temperatures below -50°F.",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Common Kingfisher",
      "Wild Birds",
      "Clean, slow-flowing freshwater streams, rivers, and canals with overhanging vegetation across Eurasia and North Africa.",
      "Small freshwater fish (minnows, sticklebacks), aquatic insects, and freshwater shrimp.",
      "Wild riverine bird (not a domestic pet). Supported via riverbank conservation and pesticide-free clean aquatic ecosystems.",
      "Highly solitary and territorial along riverbank stretches; only associates with mates during active breeding.",
      "5 - 10 years in the wild",
      "Kingfishers dive into water at speeds over 25 mph with their eyes closed behind a third eyelid, catching fish entirely by precision instinct.",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Sulphur-Crested Cockatoo",
      "Parrots",
      "Forest edges, woodlands, savanna country, and urban parklands across eastern and northern Australia and New Guinea.",
      "Large parrot pellets, legumes, fresh corn, walnuts, almonds, root vegetables, and native eucalyptus seed pods.",
      "Extra-large heavy-gauge stainless steel cage (minimum 48\" x 36\" x 64\") with heavy destructible pine blocks and foraging drawers.",
      "Extremely social and cognitively demanding. Needs 3-5 hours of interactive flight time, problem-solving puzzles, and vocal routines.",
      "60 - 80+ years",
      "Sulphur-crested cockatoos are almost 100% left-footed, and their dramatic yellow crest fans out like a radiant crown when startled or joyful.",
      "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "California Quail",
      "Wild Birds",
      "Chaparral, sagebrush, coastal scrub, and agricultural brushlands of western North America.",
      "Wild grass seeds, lupines, clover, wild berries, green shoots, and ground beetles.",
      "Ground aviary with soft pine leaf litter, dry sand dust-bath bowls, and dense brush hideaways.",
      "Forms tightly knit coveys that forage together, posting designated sentinels on high fence posts to scan for predators.",
      "4 - 6 years",
      "The distinctive forward-drooping head plume (topknot) of the California quail is actually made up of six intricately overlapping feathers!",
      "https://images.unsplash.com/photo-1606567595334-d39972c85dbe?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Red-Crowned Kakariki",
      "Parrots",
      "Dense native temperate rainforests and coastal tussock grasslands of New Zealand.",
      "Small parrot pellets, dandelion blossoms, sprouted sunflower, diced apples, berries, and insect larvae.",
      "Wide flight enclosure (minimum 36\" wide) with ample floor clearance for scratching and exploring.",
      "Inquisitive, energetic ground foragers with charming goat-like 'meh-meh' vocalizations and friendly curiosity.",
      "10 - 15 years",
      "Kakarikis forage on the ground using their feet like chickens, kicking back leaf litter to uncover hidden seeds and subterranean insects!",
      "https://images.unsplash.com/photo-1612024782955-49fae79e42bb?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Rainbow Lorikeet",
      "Parrots",
      "Coastal rainforests, eucalyptus woodlands, and flowering urban parklands along eastern Australia.",
      "Specialized liquid/powder nectar diet, sweet tropical fruits (papaya, melon, pears), and non-toxic blossoms (hibiscus, bottlebrush).",
      "Roomy flight cage with wipe-clean non-toxic surfaces, stainless steel bars, hanging swings, and washable perches.",
      "Boisterous, high-energy acrobats that form devoted lifelong pairs and perform comical head-bobbing courtship hops.",
      "15 - 25 years",
      "Lorikeets have unique brush-tipped tongues covered in tiny papillae evolved specifically for harvesting liquid nectar and pollen from flowers.",
      "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "European Goldfinch",
      "Finches",
      "Orchards, hedgerows, open deciduous woodlands, and thistle-rich meadows across Europe and North Africa.",
      "Fine thistle (niger) seeds, teasel seeds, dandelion heads, groundsel, and fortified finch crumble.",
      "Spacious horizontal flight cage (at least 36\" length) with thin natural fruit-tree perches and clean shallow water baths.",
      "Cheerful, social songbirds that gather in twittering winter flocks ('charms') and sing bright liquid melodies.",
      "8 - 12 years",
      "The slender bill of the European goldfinch is perfectly adapted to extract tiny seeds from within spiky, thorny thistle flowerheads.",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Mourning Dove",
      "Pigeons & Doves",
      "Open grasslands, woodland edges, suburban gardens, and agricultural farms throughout North America.",
      "Granivorous diet: cracked corn, white millet, safflower, sunflower seeds, and clean digestive grit.",
      "Quiet, draft-free aviary with wide flat resting shelves and soft nesting bowls; protect against sudden night frights.",
      "Peaceful and serene companions renowned for their soothing, meditative low 'coo-oo-oo' calls and gentle disposition.",
      "7 - 12 years in wild, up to 18 in captivity",
      "Both male and female mourning doves secrete nutritious 'crop milk' from their throat linings to nurse their squabs during the first week.",
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Red-Tailed Hawk",
      "Raptors",
      "Open country, desert savannas, pastures, and highway corridors with high perches across North America.",
      "Small mammals (mice, voles, rabbits), ground squirrels, and occasional reptiles.",
      "Protected wild raptor. Maintained in licensed rehabilitation flight mews with padded bow perches.",
      "Solitary apex predator with keen eyesight that soars on thermals; pairs defend large multi-mile hunting territories.",
      "15 - 20 years in wild, up to 30 in sanctuaries",
      "The raspy, piercing scream of the Red-Tailed Hawk is so famous that Hollywood sound designers use it for nearly every movie eagle!",
      "https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Mallard Duck",
      "Waterfowl",
      "Wetlands, ponds, quiet rivers, marshes, and urban lakes throughout the Northern Hemisphere.",
      "Aquatic vegetation, duckweed, water snails, grains, small invertebrates, and waterfowl floating pellets.",
      "Outdoor predator-proof enclosure with clean circulating swimming pond and dry straw bedding shelters.",
      "Gregarious, social waterfowl with strong group dabbling routines and seasonal pairing rituals.",
      "5 - 10 years in wild, up to 20 in domestic care",
      "Almost all domestic duck breeds worldwide (with the exception of the Muscovy) are direct descendants of the wild Mallard!",
      "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Hyacinth Macaw",
      "Parrots",
      "Semi-open palm savannas, pantanal wetlands, and gallery woodlands of central South America (Brazil, Bolivia, Paraguay).",
      "High-fat specialized diet centered on hard palm nuts (bocaiuva, acuri), macadamia nuts, walnuts, and macaw pellets.",
      "Massive walk-in custom aviary built with 1/4-inch welded stainless steel wire to withstand immense bite pressure.",
      "Gentle giants of the parrot world — deeply affectionate, intelligent, and requiring daily positive-reinforcement companionship.",
      "50 - 60+ years",
      "The Hyacinth Macaw is the longest flying parrot in the world (reaching 3.3 feet from head to tail) with brilliant cobalt plumage!",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Scarlet Macaw",
      "Parrots",
      "Humid tropical evergreen rainforests, river edges, and lowland savannas from Central America through the Amazon Basin.",
      "Macaw pellets, large nuts (pecans, almonds), tropical fruits, clay licks for mineral binding, and fresh vegetables.",
      "Extra-large flight enclosure (minimum 48\" x 36\" x 66\") with hardwood climbing branches and heavy rope coils.",
      "Monogamous, highly vocal, and demonstrative flock bird that bonds deeply with chosen family members.",
      "40 - 50+ years",
      "Scarlet macaws regularly visit clay licks (riverbank cliffs) to ingest mineral-rich clay that neutralizes toxins found in raw rainforest seeds!",
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Mandarin Duck",
      "Waterfowl",
      "Dense, shrubby riverbanks, forested ponds, and mountain lakes across East Asia, with feral populations in Europe.",
      "Acorns, water plants, seeds, small mollusks, water bugs, and floating waterfowl maintenance pellets.",
      "Landscaped aviary with deep bathing pond, grassy mounds, and elevated wood duck nest boxes.",
      "Shyer than common ducks; they pair closely and symbolize lifelong love and fidelity in East Asian art and folklore.",
      "6 - 10 years in wild, up to 15 in managed care",
      "Unlike most ducks that nest on the ground, Mandarin ducks nest high in tree cavities — ducklings jump from heights of 30+ feet right after hatching!",
      "https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Hummingbird",
      "Wild Birds",
      "Diverse flowering habitats from tropical cloud forests to coastal scrub and backyard gardens throughout the Americas.",
      "Flower nectar from tubular blossoms, small gnats and spiders for protein, and sugar-water feeders (4:1 water to refined white sugar).",
      "Protected wild bird; never kept in captivity. Supported through pesticide-free floral gardens and clean nectar feeders.",
      "Solitary, fiercely territorial defenders of flowering shrubs and feeders.",
      "3 - 5 years",
      "Hummingbirds are the only birds that can fly backwards and upside down, with wings beating up to 80 times per second and hearts beating over 1,200 bpm!",
      "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Keel-Billed Toucan",
      "Softbills",
      "Tropical, subtropical, and lowland rainforest canopies from southern Mexico through northern Colombia.",
      "Low-iron softbill pellets, fresh chopped non-citrus fruits (papaya, bananas, blueberries, melon), and occasional small reptiles.",
      "Very large flight space (minimum 12 ft length) with widely spaced branches for hopping and soft non-toxic perches.",
      "Playful and social flock bird that roosts in groups within tree cavities, tucking their massive bills beneath their wings.",
      "15 - 20 years",
      "The rainbow-colored bill of the toucan is hollow, reinforced by a honeycomb of keratin, making it surprisingly light and acting as a thermal radiator.",
      "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Diamond Dove",
      "Pigeons & Doves",
      "Arid and semi-arid grasslands, scrubby savannas, and waterholes across inland central and northern Australia.",
      "Small finch seeds, canary seed, millets, finely crushed grit, and chopped chickweed.",
      "Minimum 30\" wide cage with horizontal perching space and shallow dusting bowls; safe bar spacing (1/2\" or less).",
      "Calm, gentle, and quiet; thrives when kept in bonded pairs with a soft melodic 'coo-coo' vocalization.",
      "10 - 14 years",
      "Diamond doves are among the smallest doves in the world (measuring just 7 inches) and have striking bright orange-red rings around their eyes.",
      "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Gouldian Finch",
      "Finches",
      "Open subtropical eucalyptus woodlands and grassy savannas of northern Australia.",
      "Special seed mix of small millets, sprouted seeds, cuttlebone, egg food during molting, and clean fresh water.",
      "Horizontal flight cage (at least 32\" wide) in a warm, draft-free room (temperature maintained between 72-82°F / 22-28°C).",
      "Peaceful aviary flock finch that must be kept with other peaceful finches; dislikes handling but brings immense visual delight.",
      "6 - 8 years",
      "Known as the 'Rainbow Finch', wild Gouldian finches naturally occur in three distinct head-color morphs: black-headed, red-headed, and yellow-headed!",
      "https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Peregrine Falcon",
      "Raptors",
      "Mountain ranges, river valleys, coastal cliffs, and modern skyscrapers on every continent except Antarctica.",
      "Exclusively birds caught in mid-air (pigeons, starlings, shorebirds, and ducks).",
      "Protected wild raptor requiring certified falconry mews or authorized sanctuary flight tracks.",
      "Solitary hunter outside the breeding season; pairs return to the same cliff ledge (eyrie) year after year.",
      "12 - 15 years in wild, up to 25 in sanctuaries",
      "The Peregrine Falcon is the fastest animal in the entire animal kingdom, reaching diving stoop speeds in excess of 240 mph (386 km/h)!",
      "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Bali Myna",
      "Softbills",
      "Dry savanna thickets and lowland deciduous open forests on the island of Bali, Indonesia.",
      "Softbill insectivore pellets, crickets, mealworms, diced sweet fruits (papaya, figs), and boiled egg crumble.",
      "Extensive planted flight aviary with nest boxes, natural perching branches, and shallow bathing pans.",
      "Critically endangered species; very social with complex whistling calls, crest-raising displays, and head-bowing rituals.",
      "10 - 15 years",
      "The Bali Myna is snow-white with striking blue bare skin around the eyes and a jaunty head crest that can be raised and lowered!",
      "https://images.unsplash.com/photo-1516600164266-f3b8166ae679?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Java Sparrow",
      "Finches",
      "Open grasslands, agricultural rice paddies, and savanna fringes of the Indonesian islands of Java and Bali.",
      "Finch seed mixture with unhusked paddy rice, canary seed, fresh cucumber, and cuttlebone.",
      "Spacious flight cage (at least 30\" length) with natural perches and secure latching to prevent escapes.",
      "Gregarious, tidy, and peaceful flock bird that forms close bonds with partners, accompanied by bell-like chirping songs.",
      "7 - 10 years",
      "Despite their name, Java Sparrows are estrildid finches, recognized by their plump pink beaks and powdery grey and white plumage.",
      "https://images.unsplash.com/photo-1480044965905-02098d419e96?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Wood Duck",
      "Waterfowl",
      "Wooded swamps, beaver ponds, river floodplains, and quiet marsh edges across North America.",
      "Acorns, aquatic plant seeds, water beetles, duckweed, snails, and floating waterfowl pellets.",
      "Planted outdoor waterfowl enclosure with clean filtering water access and elevated nest boxes.",
      "Forms seasonal pairs with intricate head-pumping courtship displays and soft peeping calls.",
      "5 - 10 years in wild, up to 15 in domestic care",
      "Wood ducks have strong claws on their webbed feet that allow them to perch comfortably on high tree branches — a rarity among ducks!",
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80"
    ],
    [
      "Indian Peafowl",
      "Wild Birds",
      "Deciduous forests, open scrub, riverbanks, and cultivated agricultural orchards throughout the Indian subcontinent.",
      "Omnivorous diet: seeds, wild berries, agricultural grain, insects, small lizards, and ground frogs.",
      "Large walk-in farm enclosure or free-roaming sanctuary grounds with high nocturnal tree roosts.",
      "Harem social structure where a single flamboyant peacock commands a flock of peahens with booming 'may-awe' calls.",
      "15 - 20 years",
      "The famous peacock 'tail' is actually an elaborate train of upper tail coverts adorned with iridescent 'ocelli' (eye spots) that shimmer through structural coloration!",
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&q=80"
    ]
  ];

  // Seed / Insert missing species with INSERT OR IGNORE so existing records are preserved
  const insertSpecies = db.prepare(`
    INSERT OR IGNORE INTO species (name, type, habitat, diet, cage_setup, social_needs, lifespan, fun_facts, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertManySpecies = db.transaction((rows) => {
    for (const row of rows) insertSpecies.run(...row);
  });
  insertManySpecies(speciesSeedData);

  const totalSpeciesCount = db.prepare('SELECT COUNT(*) as count FROM species').get().count;
  console.log(`Database currently contains ${totalSpeciesCount} bird species.`);

  // Ensure initial local species images point directly to frontend public species directory
  const speciesImageMap = {
    'Cockatiel': '/species/cockatiel.jpg',
    'Budgerigar': '/species/budgerigar.jpg',
    'African Grey': '/species/african-grey.jpg',
    'Lovebird': '/species/lovebird.jpg',
    'Canary': '/species/canary.jpg',
    'Zebra Finch': '/species/zebra-finch.png',
    'Green-Cheeked Conure': '/species/green-cheeked-conure.jpg',
    'Barn Owl': '/species/barn-owl.jpg',
    'Blue Jay': '/species/blue-jay.jpg'
  };

  const updateSpeciesImage = db.prepare('UPDATE species SET image_url = ? WHERE name = ?');
  for (const [name, imageUrl] of Object.entries(speciesImageMap)) {
    updateSpeciesImage.run(imageUrl, name);
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
