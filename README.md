# FeatherCare 🪶

**FeatherCare** (formerly Nerdie Birdie) is a full-stack web application designed for companion bird owners and avian enthusiasts. It provides an authoritative bird species directory, an AI-powered bird identification tool, an early symptom checker with veterinary emergency alerts, and a personal flock logging dashboard.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, React Router 7, Vite
- **Backend:** Node.js, Express.js (v5)
- **AI Integration:** Official Google Gen AI SDK (`@google/genai`) powered by `GEMINI_API_KEY`
- **Database:** SQLite (zero-config, high-performance via `better-sqlite3`)
- **File Uploads:** `multer` (supports multipart photo identification and static image serving via `/uploads`)
- **CORS:** Configured with `cors` middleware for cross-origin requests from Vite (`http://localhost:5173`, `http://localhost:5174`) and Create React App (`http://localhost:3000`)

---

## 📁 Project Structure

```text
/
├── backend/
│   ├── server.js               # Express application, CORS, static uploads, server bootstrap
│   ├── database.js             # SQLite initialization & automatic seeding
│   ├── feathercare.db          # Auto-generated SQLite database file
│   ├── uploads/                # Directory for uploaded bird photos
│   ├── routes/
│   │   ├── species.js          # /api/species & /api/species/:id
│   │   ├── identification.js   # /api/identify (multipart photo & text heuristic)
│   │   ├── symptoms.js         # /api/symptoms (symptom checker & emergency evaluation)
│   │   └── userBirds.js        # /api/my-birds (CRUD personal bird profiles)
│   └── package.json
├── nerdie-frontend/ (or frontend/)
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js          # Centralized API service client
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page with search bar
│   │   │   ├── Explore.jsx     # Bird explorer with search, category filter & modal
│   │   │   ├── SpeciesDetail.jsx # Full-page species care & nutrition profile
│   │   │   ├── Identify.jsx    # Photo upload & feature identification
│   │   │   ├── Symptom.jsx     # Symptom evaluation & vet emergency alerts
│   │   │   ├── MyBirds.jsx     # Full CRUD personal flock tracker
│   │   │   └── Bonding.jsx     # Bird bonding & behavioral guide
│   │   └── App.jsx             # React Router configuration
│   └── vite.config.js          # Vite configuration with /api proxy
├── package.json                # Root package with concurrent dev runner
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the install command from the root directory:
```bash
npm run install:all
```
*(Alternatively, run `npm install` in both `backend` and `nerdie-frontend`)*

### Configure Gemini AI (backend only)
Copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY` to a key from Google AI Studio. The key is read only by the backend and must never be added to frontend environment variables. `GEMINI_MODEL` is optional; the default is `gemini-2.5-flash`.

AI endpoints return a clear error instead of invented AI results when Gemini is unconfigured, rate-limited, times out, or returns an unreadable response. Identification accepts JPEG, PNG, and WEBP files up to 10 MB, validates file contents, and sends the image bytes to Gemini without retaining the upload.

### 3. Run Concurrently (Recommended)
From the root directory:
```bash
npm run dev
```
This boots both the Express backend and Vite frontend simultaneously:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5001](http://localhost:5001) (or `http://localhost:5000`)

---

## 💻 Running Backend & Frontend Individually

### Start Backend Only
```bash
cd backend
npm run dev
```
*Listens on port `5001` (or `PORT` environment variable). Includes an automatic fallback to prevent port conflicts with Apple's AirPlay Receiver on macOS.*

### Start Frontend Only
```bash
cd nerdie-frontend
npm run dev
```
*Listens on [http://localhost:5173](http://localhost:5173).*

---

## 🗄️ Database Schema & Auto-Seeding

On first startup, `backend/database.js` automatically creates and populates `backend/feathercare.db`:

1. **`species`**:
   - `id`, `name`, `type` ("Parrots", "Finches", "Wild Birds"), `habitat`, `diet`, `cage_setup`, `social_needs`, `lifespan`, `fun_facts`, `image_url`
   - *Pre-seeded with 9 species:* Cockatiel, Budgerigar, African Grey, Lovebird, Canary, Zebra Finch, Green-Cheeked Conure, Barn Owl, Blue Jay.

2. **`user_birds`**:
   - `id`, `name`, `species_id` (foreign key to `species.id`), `age`, `notes`, `created_at`
   - *Pre-seeded with sample birds:* Sunny (Cockatiel), Pip (Budgie), Kiwi (Conure).

3. **`symptoms`**:
   - `id`, `symptom`, `possible_causes`, `care_tips`, `vet_emergency` (0 or 1), `description`
   - *Pre-seeded with critical avian symptoms:* Not eating, Feather loss, Low activity, Breathing problem, Unusual stool, Excessive scratching, Tail bobbing, Bleeding / Broken Blood Feather.

---

## 🔌 REST API Endpoints

### 1. Species (`/api/species`)
- `GET /api/species` — Retrieve all species. Supports `?search=` (filters name, fun facts, diet, habitat) and `?type=` (filters Parrots, Finches, Wild Birds, Pet, etc.).
- `GET /api/species/types` — List all distinct species categories.
- `GET /api/species/:id` — Detailed care, habitat, diet, and behavior profile for a specific species.

### 2. Bird Identification (`/api/identify`)
- `POST /api/identify` — Accepts `multipart/form-data` with a JPEG, PNG, or WEBP image (`photo` or `image`, up to 10 MB) and/or text `description`. Gemini analyzes the supplied image bytes and/or description and returns a species, confidence, and rationale. Uploads are not retained.

### 3. Symptom Checker (`/api/symptoms`)
- `GET /api/symptoms` — Retrieve all cataloged symptoms.
- `POST /api/symptoms` — Evaluates an array of selected symptoms (`{ symptoms: [...], species: "Budgie", birdName: "Sunny" }`) with Gemini AI. Returns consolidated `possible_causes`, `care_tips`, a `vet_emergency_flag: true|false`, and a veterinary medical disclaimer.

### 4. AI Bonding Activity Suggestions (`/api/bonding-tip`)
- `POST /api/bonding-tip` — Accepts `{ species, age, notes, birdName }`. Prompts Gemini to generate a personalized, positive-reinforcement bonding routine tailored to the bird's behavioral history, returning `bonding_tip_title`, `tip_content`, and `recommended_time`.

### 5. My Birds CRUD (`/api/my-birds`)
- `GET /api/my-birds` — Retrieve all logged birds joined with species metadata.
- `POST /api/my-birds` — Create a new bird profile (`{ name, species_id, age, notes }`).
- `PUT /api/my-birds/:id` — Update bird name, age, or health notes.
- `DELETE /api/my-birds/:id` — Remove a bird profile.

---

## 🧪 Testing the API

```bash
# Check API health
curl http://localhost:5001/api/health

# Search for Cockatiel
curl "http://localhost:5001/api/species?search=cockatiel"

# Test Symptom Checker
curl -X POST http://localhost:5001/api/symptoms \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["Not eating", "Breathing problem"], "birdName": "Sunny"}'

# Test Bird Identification with text description
curl -X POST http://localhost:5001/api/identify \
  -F "description=small parrot with crest and orange cheeks"
```
