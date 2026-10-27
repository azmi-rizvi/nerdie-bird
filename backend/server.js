const path = require('path');
const dns = require('dns');

// Prioritize IPv4 for Google API network calls
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Ensure database is initialized
require('./database');

const speciesRouter = require('./routes/species');
const identificationRouter = require('./routes/identification');
const symptomsRouter = require('./routes/symptoms');
const userBirdsRouter = require('./routes/userBirds');
const bondingRouter = require('./routes/bonding');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '5001', 10);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 1. CORS Configuration
// Allow frontend dev servers (5173, 5174, 3000, etc.)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// 2. Body Parsing Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 3. Static File Serving for Uploads
app.use('/uploads', express.static(uploadsDir));

// 4. API Status & Health Check
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    app: 'FeatherCare / Nerdie Birdie API',
    endpoints: {
      species: '/api/species',
      species_by_id: '/api/species/:id',
      identification: 'POST /api/identify (Gemini Multimodal Vision)',
      symptoms: 'GET & POST /api/symptoms (Gemini Clinical Analysis)',
      bonding: 'POST /api/bonding-tip or /api/bonding (Gemini Personalized Advice)',
      user_birds: 'GET, POST, PUT, DELETE /api/my-birds'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 5. Mount Routes
app.use('/api/species', speciesRouter);
app.use('/api/identify', identificationRouter);
app.use('/api/symptoms', symptomsRouter);
app.use('/api/my-birds', userBirdsRouter);
app.use('/api/bonding-tip', bondingRouter);
app.use('/api/bonding', bondingRouter);

// 6. 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening with graceful port binding & fallback
function startServer(port, maxRetries = 3) {
  const server = app.listen(port, () => {
    console.log(`===============================================`);
    console.log(` FeatherCare Express Server running on port ${port}`);
    console.log(` Health check: http://localhost:${port}/api/health`);
    console.log(` Endpoints:`);
    console.log(`   - Species:        http://localhost:${port}/api/species`);
    console.log(`   - Symptoms:       http://localhost:${port}/api/symptoms`);
    console.log(`   - My Birds:       http://localhost:${port}/api/my-birds`);
    console.log(`   - Identification: http://localhost:${port}/api/identify`);
    console.log(`   - Bonding Tip:    http://localhost:${port}/api/bonding-tip`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[FeatherCare Backend] Port ${port} is already in use.`);
      if (maxRetries > 0) {
        const nextPort = port + 1;
        console.log(`[FeatherCare Backend] Attempting fallback to port ${nextPort}...`);
        startServer(nextPort, maxRetries - 1);
      } else {
        console.error(`[FeatherCare Backend] Could not bind to an open port: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.error('[FeatherCare Backend] Server runtime error:', err);
    }
  });

  return server;
}

if (require.main === module) {
  startServer(DEFAULT_PORT);
}

module.exports = { app, startServer };
