# 🦜 FeatherCare (Nerdie Birdie)
### Simple First-Semester Viva & Project Understanding Guide (3-Page Reference)

> **Quick Team Note:**  
> This guide is prepared for all 5 team members. It explains our bird care project in simple, everyday terms. You do not need deep programming mastery to understand this—read through it to get the story of how our website works, what each button does, and how our code ties together so you can answer questions easily in the viva.
>
> 📄 **Word Document Version:** You can also find and share the formatted Microsoft Word file: [`FeatherCare_Viva_Guide.docx`](file:///C:/Users/absrv/OneDrive/Desktop/nerdie/nerdie-bird/FeatherCare_Viva_Guide.docx).

---

## 1. What is FeatherCare in Simple Words?
**FeatherCare** is a full-stack website designed to help pet bird owners take proper care of their birds. Caring for a bird is very different from caring for a dog or cat. Birds hide illnesses until they are severe, have fragile breathing systems, and need daily mental interaction. Our app provides 5 main tools:

* **Explore Birds:** An online encyclopedia showing different bird species, their real photos, lifespans, and what they like to eat.
* **My Birds:** A digital pet passport where owners save their own birds with names, age, and behavior notes.
* **AI Bird Identifier:** A smart camera tool where you upload a bird photo, and AI analyzes its feathers to tell you what species it is.
* **AI Symptom Checker:** If a bird looks unwell, the user ticks observed symptoms, and AI suggests home care tips and flags if it is an emergency.
* **AI Bonding Activities:** Generates fun daily exercises customized to the bird’s personality to build trust without stressing the bird.

---

## 2. The Three Main Building Blocks (Tech Stack)
Our project is split into three simple parts that work together as a team:

1. **The Frontend (What the user sees):**  
   Built with **React.js, HTML, and CSS**. It runs in the web browser on port `5173`. It shows all the buttons, cards, forms, and colors. When you click around, the page does not need to reload because React swaps views smoothly without page refreshes.
2. **The Backend (The server/brain):**  
   Built with **Node.js and Express.js**. It runs in the background on port `5001`. It listens for requests from React, talks to our database, and communicates with Google Gemini AI.
3. **The Database (The notebook):**  
   We used **SQLite (`feathercare.db`)**. Unlike heavy databases that require installing separate software, SQLite is a lightweight database that saves everything inside a simple file right inside our project folder. It stores bird species info, symptoms, and saved pet birds.

---

## 3. How the Pieces Talk to Each Other (The Workflow)
Whenever an examiner asks, *"How does your frontend talk to your backend?"*, here is the simple 4-step story:

> **The 4-Step Communication Story:**
> 1. **Step 1:** The user interacts with the React frontend (e.g., clicks "Identify Bird" or selects a symptom).
> 2. **Step 2:** React sends an HTTP request with data formatted as JSON to our Express server on port `5001`.
> 3. **Step 3:** The Express backend processes the request: it looks up the SQLite database or calls Google Gemini AI.
> 4. **Step 4:** Express sends the answer back as clean JSON. React receives it and immediately updates the screen.

---

## 4. Walking Through Each Page & How It Works

### A. Explore Birds Page
When you open this page, React asks the backend for all bird species. The backend reads from SQLite and returns a list containing Cockatiel, Budgerigar, African Grey, Lovebird, Canary, Zebra Finch, Green-Cheeked Conure, Barn Owl, and Blue Jay. Users can search by name or click category filters (Parrots, Finches, Wild Birds). All photos are stored locally on our server so they load instantly and never show broken links.

### B. My Birds Page (CRUD Operations)
This page lets bird owners manage their personal flock. In software, this is called **CRUD**:
* **Create:** Fill the form with name, species, age, and notes $\rightarrow$ Saved to the database.
* **Read:** The page lists all your saved birds with neat badges.
* **Update:** Click the Edit button to update notes (e.g., "Learned to whistle!").
* **Delete:** Click the Delete button to remove a bird from your saved list.

### C. Bird Identification Page (Multimodal AI Vision)
A user uploads a photo of a bird from their phone or laptop. The backend receives the file using Multer, converts the image bytes into base64 text, and sends it to Google Gemini AI. Gemini looks at the visual features—the crest on top of the head, orange cheek patches, beak shape, and feather patterns—and returns the species name, match confidence (High/Medium), and care facts. The user can click a button to add that bird straight to My Birds.

### D. Symptom Checker Page (AI Health Triage)
The user selects observed signs (such as "Tail bobbing" or "Sitting on cage floor"). The backend sends these symptoms and the bird's species to Gemini AI. The AI analyzes possible reasons and suggests safe home supportive steps (like keeping the room at 82–85°F and dimming lights). If the symptoms are severe, it shows a bright red Emergency Warning. It always displays a clear medical disclaimer reminding owners that AI provides educational guidance, not veterinary diagnosis.

### E. Bonding Guide Page (Personalized Advice)
Building trust with a bird takes patience. The user selects their bird or enters behavior notes (e.g. "Scared of hands, loves whistling"). Gemini generates a customized exercise (like whistling melodies softly from a few feet away and offering treats on a neutral perch) to help owner and pet bond safely.

---

## 5. Understanding the AI in Simple Terms

* **Which model do we use?**  
  We use Google's official `@google/genai` library with the `gemini-flash-lite-latest` model. It is high-speed and returns smart answers in about 1 to 2 seconds.
* **What does "Multimodal" mean?**  
  Normal AI only reads text. Multimodal AI can understand both text and pictures at the same time. This is how our application can look at an uploaded bird photo and recognize what species it is.
* **What if the internet is slow or AI hits a limit?**  
  We built a smart fallback system! If Gemini is busy or temporarily unavailable, our server does not crash. It automatically uses verified records from our SQLite database to give the user safe, helpful guidance.

---

## 6. Essential Vocabulary (Cheat Sheet)

* **Frontend:** The visual part in the browser created with React (buttons, cards, forms).
* **Backend / Server:** The invisible engine created with Express and Node.js that runs on port `5001`.
* **REST API:** The set of URL endpoints (like `/api/species` or `/api/identify`) that React calls to get or send data.
* **JSON:** A clean, lightweight text format for sending structured data (like `{"species": "Cockatiel"}`).
* **SQLite Database:** A file named `feathercare.db` where our bird catalog and user pet records are permanently saved.
* **Multer:** A Node.js tool that lets our backend accept photo file uploads.

---

## 7. Top 5 Things to Say in Your Viva (Memorize These!)

1. *"FeatherCare is a full-stack web application designed to help pet bird owners with species exploration, bird identification, health symptom checking, and personalized bonding routines."*
2. *"We built the frontend using React with Vite for a fast single-page experience, and the backend using Node.js and Express to handle REST API requests on port 5001."*
3. *"We chose SQLite because it is lightweight, serverless, and stores our species catalog and user bird records in a simple, portable file."*
4. *"We integrated Google Gemini AI for multimodal vision (identifying birds from uploaded photos) and clinical triage (analyzing symptoms and flagging emergencies in 1–2 seconds).."*
5. *"We built safety and reliability into the app: every health report includes an avian vet disclaimer, and our backend has fallback mechanisms so it stays functional even if external AI quotas are reached."*
